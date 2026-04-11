const BaseService = require('./base/BaseService');
const { ownerRepository } = require('../repositories');
const { userRepository } = require('../repositories');
const { prisma } = require('../database/connection');
const { NotFoundException, ForbiddenException, ConflictException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const logger = require('../middleware/logger');

class OwnerService extends BaseService {
  constructor() {
    super(ownerRepository);
  }

  async registerAsOwner(userId, businessData) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw NotFoundException.user(userId);
      }

      const existingOwner = await tx.owner.findUnique({ where: { userId } });
      if (existingOwner) {
        throw ConflictException('User is already registered as owner');
      }

      if (businessData.gstNumber) {
        const gstExists = await tx.owner.findFirst({ where: { gstNumber: businessData.gstNumber } });
        if (gstExists) {
          throw ConflictException('GST number already registered');
        }
      }

      if (businessData.panNumber) {
        const panExists = await tx.owner.findFirst({ where: { panNumber: businessData.panNumber } });
        if (panExists) {
          throw ConflictException('PAN number already registered');
        }
      }

      const owner = await tx.owner.create({
        data: {
          userId,
          businessName: businessData.businessName,
          gstNumber: businessData.gstNumber,
          panNumber: businessData.panNumber,
          verificationStatus: 'PENDING'
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: ROLES.OWNER }
      });

      logger.info('User registered as owner', { userId, ownerId: owner.id });
      return owner;
    });
  }

  async getMyOwnerProfile(userId) {
    const owner = await this.repository.findByUserId(userId);
    
    if (!owner) {
      throw NotFoundException('Owner profile', userId);
    }

    return owner;
  }

  async updateOwnerProfile(userId, updates) {
    const owner = await this.getMyOwnerProfile(userId);

    const sensitiveFields = ['gstNumber', 'panNumber'];
    const sensitiveFieldChanged = sensitiveFields.some(field => 
      updates[field] && updates[field] !== owner[field]
    );

    if (updates.gstNumber && updates.gstNumber !== owner.gstNumber) {
      const gstExists = await this.repository.exists({ gstNumber: updates.gstNumber });
      if (gstExists) {
        throw ConflictException('GST number already registered');
      }
    }

    if (updates.panNumber && updates.panNumber !== owner.panNumber) {
      const panExists = await this.repository.exists({ panNumber: updates.panNumber });
      if (panExists) {
        throw ConflictException('PAN number already registered');
      }
    }

    const allowedFields = ['businessName', 'gstNumber', 'panNumber'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const updateData = { ...filteredUpdates };
    if (sensitiveFieldChanged && owner.verificationStatus === 'APPROVED') {
      updateData.verificationStatus = 'PENDING';
      logger.info('Owner verification reset due to sensitive field change', { ownerId: owner.id });
    }

    const updated = await this.repository.updateById(owner.id, updateData);

    logger.info('Owner profile updated', { ownerId: owner.id });
    return updated;
  }

  async getOwnerById(ownerId) {
    const owner = await this.repository.findById(ownerId, { include: { user: true } });
    
    if (!owner) {
      throw NotFoundException('Owner', ownerId);
    }

    return owner;
  }

  async verifyOwner(ownerId, adminId, adminRole) {
    if (adminRole !== ROLES.ADMIN) {
      throw ForbiddenException.requireAdmin();
    }

    const owner = await this.getOwnerById(ownerId);
    
    if (owner.verificationStatus === 'APPROVED') {
      throw BadRequestException('Owner is already verified');
    }

    const verified = await this.repository.updateById(ownerId, {
      verificationStatus: 'APPROVED'
    });

    logger.info('Owner verified', { ownerId, adminId });
    return verified;
  }

  async rejectOwner(ownerId, adminId, adminRole, reason) {
    if (adminRole !== ROLES.ADMIN) {
      throw ForbiddenException.requireAdmin();
    }

    if (!reason || reason.trim().length === 0) {
      throw BadRequestException('Rejection reason is required');
    }

    const owner = await this.getOwnerById(ownerId);
    
    if (owner.verificationStatus === 'REJECTED') {
      throw BadRequestException('Owner is already rejected');
    }

    const rejected = await this.repository.updateById(ownerId, {
      verificationStatus: 'REJECTED',
      rejectionReason: reason.trim()
    });

    logger.info('Owner rejected', { ownerId, adminId, reason });
    return rejected;
  }

  async getAllOwners(options = {}) {
    return await this.repository.paginate({}, options);
  }

  async getPendingOwners(options = {}) {
    const result = await this.repository.paginate(
      { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      { include: { user: true }, ...options }
    );
    return result;
  }

  async getOwnerDashboard(userId) {
    const owner = await this.getMyOwnerProfile(userId);
    
    const { fleetService } = require('../services');
    const stats = await fleetService.getFleetStats(userId);
    const utilization = await fleetService.getVehicleUtilization(userId, 30);

    return {
      owner,
      stats,
      utilization: {
        totalVehicles: utilization.length,
        averageUtilization: utilization.length > 0
          ? utilization.reduce((sum, v) => sum + parseFloat(v.utilizationRate || 0), 0) / utilization.length
          : 0
      }
    };
  }
}

module.exports = new OwnerService();
