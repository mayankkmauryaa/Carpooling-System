const BaseService = require('./base/BaseService');
const { ownerDocumentRepository } = require('../repositories');
const { ownerRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const { OWNER_DOCUMENT_TYPES } = require('../constants/documentTypes');
const logger = require('../middleware/logger');

class OwnerDocumentService extends BaseService {
  constructor() {
    super(ownerDocumentRepository);
  }

  async uploadDocument(ownerId, documentType, url, expiresAt = null) {
    const owner = await ownerRepository.findById(ownerId);
    if (!owner) {
      throw NotFoundException('Owner', ownerId);
    }

    const validTypes = Object.values(OWNER_DOCUMENT_TYPES);
    if (!validTypes.includes(documentType)) {
      throw BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    const existingDoc = await this.repository.findByOwnerAndType(ownerId, documentType);
    
    if (existingDoc) {
      const updated = await this.repository.updateById(existingDoc.id, {
        url,
        expiresAt,
        status: 'UPLOADED'
      });
      logger.info('Owner document updated', { ownerId, documentType, docId: updated.id });
      return updated;
    }

    const document = await this.repository.create({
      ownerId,
      documentType,
      url,
      expiresAt,
      status: 'UPLOADED'
    });

    logger.info('Owner document uploaded', { ownerId, documentType, docId: document.id });
    return document;
  }

  async getMyDocuments(ownerId) {
    return await this.repository.findByOwner(ownerId);
  }

  async getDocumentById(documentId, requestingUserId = null, requestingRole = null) {
    const document = await this.findById(documentId);
    if (!document) {
      throw NotFoundException('Owner document', documentId);
    }
    
    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      const owner = await ownerRepository.findById(document.ownerId);
      if (!owner || owner.userId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }
    
    return document;
  }

  async deleteDocument(documentId, ownerId) {
    const document = await this.getDocumentById(documentId);
    
    if (document.ownerId !== ownerId) {
      throw ForbiddenException.notOwner();
    }

    await this.repository.deleteById(documentId);
    logger.info('Owner document deleted', { documentId, ownerId });
    return { message: 'Document deleted successfully' };
  }

  async submitForReview(ownerId) {
    const documents = await this.repository.findByOwner(ownerId);
    
    const requiredDocs = [OWNER_DOCUMENT_TYPES.GST, OWNER_DOCUMENT_TYPES.PAN];
    const uploadedTypes = documents.map(d => d.documentType);
    
    const missingDocs = requiredDocs.filter(type => !uploadedTypes.includes(type));
    if (missingDocs.length > 0) {
      throw BadRequestException(`Missing required documents: ${missingDocs.join(', ')}`);
    }

    const docsToUpdate = documents.filter(d => d.status === 'UPLOADED');
    
    if (docsToUpdate.length === 0) {
      throw BadRequestException('No documents to submit for review');
    }

    const { prisma } = require('../database/connection');
    await prisma.$transaction(
      docsToUpdate.map(doc => 
        prisma.ownerDocument.update({
          where: { id: doc.id },
          data: { status: 'UNDER_REVIEW' }
        })
      )
    );

    logger.info('Owner documents submitted for review', { ownerId });
    return { message: 'Documents submitted for review' };
  }

  async getPendingDocuments(options = {}) {
    return await this.repository.paginate(
      { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } },
      { include: { owner: { include: { user: true } } }, ...options }
    );
  }

  async verifyDocument(documentId, adminId, adminRole) {
    if (adminRole !== ROLES.ADMIN) {
      throw ForbiddenException.requireAdmin();
    }

    const document = await this.getDocumentById(documentId);
    
    if (document.status === 'APPROVED') {
      throw BadRequestException('Document is already verified');
    }

    const verified = await this.repository.verifyDocument(documentId, adminId);
    
    await this.checkAndUpdateOwnerVerification(document.ownerId);
    
    logger.info('Owner document verified', { documentId, adminId });
    
    return verified;
  }

  async checkAndUpdateOwnerVerification(ownerId) {
    const documents = await this.repository.findByOwner(ownerId);
    
    if (documents.length === 0) return;
    
    const requiredTypes = [OWNER_DOCUMENT_TYPES.GST, OWNER_DOCUMENT_TYPES.PAN];
    const requiredDocs = documents.filter(d => requiredTypes.includes(d.documentType));
    
    if (requiredDocs.length < requiredTypes.length) return;
    
    const hasRejected = documents.some(d => d.status === 'REJECTED');
    const allApproved = documents.every(d => d.status === 'APPROVED');
    
    if (allApproved) {
      await ownerRepository.updateById(ownerId, { verificationStatus: 'APPROVED' });
    } else if (hasRejected) {
      await ownerRepository.updateById(ownerId, { verificationStatus: 'REJECTED' });
    }
  }

  async rejectDocument(documentId, adminId, adminRole, reason) {
    if (adminRole !== ROLES.ADMIN) {
      throw ForbiddenException.requireAdmin();
    }

    if (!reason || reason.trim().length === 0) {
      throw BadRequestException('Rejection reason is required');
    }

    const document = await this.getDocumentById(documentId);
    
    if (document.status === 'REJECTED') {
      throw BadRequestException('Document is already rejected');
    }

    const rejected = await this.repository.rejectDocument(documentId, reason, adminId);
    
    await this.checkAndUpdateOwnerVerification(document.ownerId);
    
    logger.info('Owner document rejected', { documentId, adminId, reason });
    
    return rejected;
  }

  async checkExpiringDocuments(daysThreshold = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    return await this.repository.findAll(
      {
        status: 'APPROVED',
        expiresAt: { lte: futureDate, gt: new Date() }
      },
      { include: { owner: { include: { user: true } } } }
    );
  }

  async markExpiredDocuments() {
    const expiredDocs = await this.repository.findExpiredDocuments();
    const results = [];
    const ownerIdsToUpdate = new Set();

    for (const doc of expiredDocs) {
      await this.repository.markAsExpired(doc.id);
      ownerIdsToUpdate.add(doc.ownerId);
      results.push(doc.id);
    }

    for (const ownerId of ownerIdsToUpdate) {
      await this.checkAndUpdateOwnerVerification(ownerId);
    }

    if (results.length > 0) {
      logger.info('Marked expired owner documents', { count: results.length });
    }

    return results;
  }

  async getDocumentStatus(ownerId) {
    const documents = await this.repository.findByOwner(ownerId);
    const uploadedTypes = documents.map(d => d.documentType);
    const allRequired = Object.values(OWNER_DOCUMENT_TYPES);
    
    return {
      documents,
      isComplete: allRequired.every(type => uploadedTypes.includes(type)),
      missingDocuments: allRequired.filter(type => !uploadedTypes.includes(type)),
      verificationStatus: this.calculateVerificationStatus(documents)
    };
  }

  calculateVerificationStatus(documents) {
    if (documents.length === 0) return 'NONE';
    
    const statuses = documents.map(d => d.status);
    
    if (statuses.every(s => s === 'APPROVED')) return 'VERIFIED';
    if (statuses.some(s => s === 'REJECTED')) return 'REJECTED';
    if (statuses.some(s => s === 'UNDER_REVIEW')) return 'UNDER_REVIEW';
    if (statuses.every(s => s === 'UPLOADED')) return 'PENDING_REVIEW';
    
    return 'PENDING';
  }
}

module.exports = {
  ownerDocumentService: new OwnerDocumentService()
};
