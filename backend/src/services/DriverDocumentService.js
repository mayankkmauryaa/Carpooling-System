const BaseService = require('./base/BaseService');
const { driverDocumentRepository } = require('../repositories');
const { userRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const { DRIVER_DOCUMENT_TYPES } = require('../constants/documentTypes');
const logger = require('../middleware/logger');

class DriverDocumentService extends BaseService {
  constructor() {
    super(driverDocumentRepository);
  }

  async uploadDocument(requestingUserId, documentType, url, expiresAt = null, requestingRole = null) {
    const user = await userRepository.findById(requestingUserId);
    if (!user || user.role !== ROLES.DRIVER) {
      throw ForbiddenException.requireDriver();
    }

    if (requestingRole !== ROLES.ADMIN && requestingRole !== ROLES.OWNER) {
      if (user.id !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }

    const validTypes = Object.values(DRIVER_DOCUMENT_TYPES);
    if (!validTypes.includes(documentType)) {
      throw BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    const existingDoc = await this.repository.findByDriverAndType(requestingUserId, documentType);
    
    if (existingDoc) {
      const updated = await this.repository.updateById(existingDoc.id, {
        url,
        expiresAt,
        status: 'UPLOADED'
      });
      logger.info('Driver document updated', { driverId: requestingUserId, documentType, docId: updated.id });
      return updated;
    }

    const document = await this.repository.create({
      driverId: requestingUserId,
      documentType,
      url,
      expiresAt,
      status: 'UPLOADED'
    });

    logger.info('Driver document uploaded', { driverId: requestingUserId, documentType, docId: document.id });
    return document;
  }

  async getMyDocuments(driverId) {
    return await this.repository.findByDriver(driverId);
  }

  async getDocumentById(documentId, requestingUserId = null, requestingRole = null) {
    const document = await this.findById(documentId);
    if (!document) {
      throw NotFoundException('Driver document', documentId);
    }
    
    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      if (document.driverId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }
    
    return document;
  }

  async deleteDocument(documentId, driverId) {
    const document = await this.getDocumentById(documentId);
    
    if (document.driverId !== driverId) {
      throw ForbiddenException.notOwner();
    }

    await this.repository.deleteById(documentId);
    logger.info('Driver document deleted', { documentId, driverId });
    return { message: 'Document deleted successfully' };
  }

  async submitForReview(driverId) {
    const documents = await this.repository.findByDriver(driverId);
    
    const requiredDocs = [DRIVER_DOCUMENT_TYPES.DRIVING_LICENSE, DRIVER_DOCUMENT_TYPES.AADHAAR];
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
        prisma.driverDocument.update({
          where: { id: doc.id },
          data: { status: 'UNDER_REVIEW' }
        })
      )
    );

    logger.info('Driver documents submitted for review', { driverId });
    return { message: 'Documents submitted for review' };
  }

  async getPendingDocuments(options = {}) {
    return await this.repository.paginate(
      { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } },
      { include: { driver: true }, ...options }
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
    
    await this.checkAndUpdateDriverVerification(document.driverId);
    
    logger.info('Driver document verified', { documentId, adminId });
    
    return verified;
  }

  async checkAndUpdateDriverVerification(driverId) {
    const documents = await this.repository.findByDriver(driverId);
    
    if (documents.length === 0) return;
    
    const requiredTypes = [DRIVER_DOCUMENT_TYPES.DRIVING_LICENSE, DRIVER_DOCUMENT_TYPES.AADHAAR];
    const requiredDocs = documents.filter(d => requiredTypes.includes(d.documentType));
    
    if (requiredDocs.length < requiredTypes.length) return;
    
    const hasRejected = documents.some(d => d.status === 'REJECTED');
    const allApproved = documents.every(d => d.status === 'APPROVED');
    
    if (allApproved) {
      await userRepository.updateById(driverId, { isActive: true });
    } else if (hasRejected) {
      await userRepository.updateById(driverId, { isActive: false });
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
    
    await this.checkAndUpdateDriverVerification(document.driverId);
    
    logger.info('Driver document rejected', { documentId, adminId, reason });
    
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
      { include: { driver: true } }
    );
  }

  async markExpiredDocuments() {
    const expiredDocs = await this.repository.findExpiredDocuments();
    const results = [];

    for (const doc of expiredDocs) {
      await this.repository.markAsExpired(doc.id);
      results.push(doc.id);
    }

    if (results.length > 0) {
      logger.info('Marked expired driver documents', { count: results.length });
    }

    return results;
  }

  async getDocumentStatus(driverId) {
    const documents = await this.repository.findByDriver(driverId);
    const uploadedTypes = documents.map(d => d.documentType);
    const allRequired = Object.values(DRIVER_DOCUMENT_TYPES);
    
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

module.exports = new DriverDocumentService();
