const BaseService = require('./base/BaseService');
const { vehicleDocumentRepository } = require('../repositories');
const { vehicleRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const { VEHICLE_DOCUMENT_TYPES } = require('../constants/documentTypes');
const logger = require('../middleware/logger');

class VehicleDocumentService extends BaseService {
  constructor() {
    super(vehicleDocumentRepository);
  }

  async uploadDocument(ownerId, vehicleId, documentType, url, expiresAt = null) {
    const vehicle = await vehicleRepository.findById(vehicleId, { include: { driver: true } });
    
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }

    if (vehicle.driverId !== ownerId) {
      throw ForbiddenException.notOwner();
    }

    const validTypes = Object.values(VEHICLE_DOCUMENT_TYPES);
    if (!validTypes.includes(documentType)) {
      throw BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    const existingDoc = await this.repository.findByVehicleAndType(vehicleId, documentType);
    
    if (existingDoc) {
      const updated = await this.repository.updateById(existingDoc.id, {
        url,
        expiresAt,
        status: 'UPLOADED'
      });
      logger.info('Vehicle document updated', { vehicleId, documentType, docId: updated.id });
      return updated;
    }

    const document = await this.repository.create({
      vehicleId,
      documentType,
      url,
      expiresAt,
      status: 'UPLOADED'
    });

    logger.info('Vehicle document uploaded', { vehicleId, documentType, docId: document.id });
    return document;
  }

  async getVehicleDocuments(vehicleId, ownerId = null) {
    if (ownerId) {
      const vehicle = await vehicleRepository.findById(vehicleId);
      if (!vehicle) {
        throw NotFoundException.vehicle(vehicleId);
      }
      if (vehicle.driverId !== ownerId) {
        throw ForbiddenException.notOwner();
      }
    }
    
    return await this.repository.findByVehicle(vehicleId);
  }

  async getMyVehicleDocuments(driverId) {
    const vehicles = await vehicleRepository.findByDriver(driverId);
    const vehicleIds = vehicles.map(v => v.id);
    
    const documents = [];
    for (const vehicleId of vehicleIds) {
      const docs = await this.repository.findByVehicle(vehicleId);
      documents.push(...docs.map(d => ({ ...d, vehicleId })));
    }
    
    return documents;
  }

  async getDocumentById(documentId, requestingUserId = null, requestingRole = null) {
    const document = await this.findById(documentId);
    if (!document) {
      throw NotFoundException('Vehicle document', documentId);
    }
    
    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      const vehicle = await vehicleRepository.findById(document.vehicleId);
      if (!vehicle || vehicle.driverId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }
    
    return document;
  }

  async deleteDocument(documentId, ownerId) {
    const document = await this.getDocumentById(documentId);
    const vehicle = await vehicleRepository.findById(document.vehicleId);
    
    if (vehicle.driverId !== ownerId) {
      throw ForbiddenException.notOwner();
    }

    await this.repository.deleteById(documentId);
    logger.info('Vehicle document deleted', { documentId, ownerId });
    return { message: 'Document deleted successfully' };
  }

  async submitForReview(vehicleId, ownerId) {
    const vehicle = await vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }

    if (vehicle.driverId !== ownerId) {
      throw ForbiddenException.notOwner();
    }

    const documents = await this.repository.findByVehicle(vehicleId);
    
    const requiredDocs = [VEHICLE_DOCUMENT_TYPES.RC, VEHICLE_DOCUMENT_TYPES.INSURANCE];
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
        prisma.vehicleDocument.update({
          where: { id: doc.id },
          data: { status: 'UNDER_REVIEW' }
        })
      )
    );

    logger.info('Vehicle documents submitted for review', { vehicleId });
    return { message: 'Documents submitted for review' };
  }

  async getPendingDocuments(options = {}) {
    return await this.repository.paginate(
      { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } },
      { include: { vehicle: true }, ...options }
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
    
    await this.checkAndUpdateVehicleVerification(document.vehicleId);
    
    logger.info('Vehicle document verified', { documentId, adminId });
    return verified;
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
    
    await vehicleRepository.updateById(document.vehicleId, { verificationStatus: 'REJECTED' });
    
    logger.info('Vehicle document rejected', { documentId, adminId, reason });
    return rejected;
  }

  async checkAndUpdateVehicleVerification(vehicleId) {
    const documents = await this.repository.findByVehicle(vehicleId);
    
    if (documents.length === 0) return;
    
    const allApproved = documents.every(d => d.status === 'APPROVED');
    const anyRejected = documents.some(d => d.status === 'REJECTED');
    const anyUnderReview = documents.some(d => d.status === 'UNDER_REVIEW');
    
    if (allApproved) {
      await vehicleRepository.updateById(vehicleId, { verificationStatus: 'VERIFIED' });
    } else if (anyRejected) {
      await vehicleRepository.updateById(vehicleId, { verificationStatus: 'REJECTED' });
    } else if (anyUnderReview) {
      await vehicleRepository.updateById(vehicleId, { verificationStatus: 'PENDING' });
    }
  }

  async checkExpiringDocuments(daysThreshold = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    return await this.repository.findAll(
      {
        status: 'APPROVED',
        expiresAt: { lte: futureDate, gt: new Date() }
      },
      { include: { vehicle: true } }
    );
  }

  async markExpiredDocuments() {
    const expiredDocs = await this.repository.findExpiredDocuments();
    const results = [];

    for (const doc of expiredDocs) {
      await this.repository.markAsExpired(doc.id);
      await vehicleRepository.updateById(doc.vehicleId, { verificationStatus: 'REJECTED' });
      results.push(doc.id);
    }

    if (results.length > 0) {
      logger.info('Marked expired vehicle documents', { count: results.length });
    }

    return results;
  }

  async getDocumentStatus(vehicleId) {
    const documents = await this.repository.findByVehicle(vehicleId);
    const uploadedTypes = documents.map(d => d.documentType);
    const allRequired = Object.values(VEHICLE_DOCUMENT_TYPES);
    
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

module.exports = new VehicleDocumentService();
