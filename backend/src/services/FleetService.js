const BaseService = require('./base/BaseService');
const { fleetRepository } = require('../repositories');
const { ownerRepository } = require('../repositories');
const { vehicleRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const { prisma } = require('../database/connection');
const logger = require('../middleware/logger');

class FleetService extends BaseService {
  constructor() {
    super(fleetRepository);
  }

  async getFleetProfile(ownerId, requestingUserId = null, requestingRole = null) {
    const owner = await ownerRepository.findByUserId(ownerId);
    if (!owner) {
      throw NotFoundException('Fleet profile', ownerId);
    }

    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      if (ownerId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }

    const vehicles = await this.repository.getFleetVehicles(ownerId);
    const stats = await this.repository.getFleetStats(ownerId);

    return {
      owner,
      vehicles: vehicles.items,
      stats,
      pagination: {
        total: vehicles.total,
        page: vehicles.page,
        limit: vehicles.limit,
        pages: vehicles.pages
      }
    };
  }

  async getFleetVehicles(ownerId, options = {}, requestingUserId = null, requestingRole = null) {
    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      if (ownerId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }
    return await this.repository.getFleetVehicles(ownerId, options);
  }

  async getFleetDrivers(ownerId, options = {}, requestingUserId = null, requestingRole = null) {
    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      if (ownerId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }
    return await this.repository.getFleetDrivers(ownerId, options);
  }

  async getFleetStats(ownerId) {
    return await this.repository.getFleetStats(ownerId);
  }

  async getVehicleUtilization(ownerId, days = 30) {
    return await this.repository.getVehicleUtilization(ownerId, days);
  }

  async assignDriverToVehicle(requestingUserId, vehicleId, driverId, requestingRole = null) {
    if (requestingRole !== ROLES.ADMIN) {
      const owner = await ownerRepository.findByUserId(requestingUserId);
      if (!owner) {
        throw NotFoundException('Fleet profile', requestingUserId);
      }

      const vehicle = await vehicleRepository.findById(vehicleId);
      if (!vehicle || vehicle.ownerId !== owner.id) {
        throw ForbiddenException.notOwner();
      }

      if (owner.verificationStatus !== 'APPROVED') {
        throw BadRequestException('Fleet must be verified to assign drivers');
      }

      const result = await this.repository.assignVehicleToDriver(vehicleId, driverId, owner.id);
      
      if (!result) {
        throw NotFoundException.vehicle(vehicleId);
      }

      logger.info('Driver assigned to vehicle', { ownerId: owner.id, vehicleId, driverId });
      return result;
    }
    
    const vehicle = await vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }

    return await this.repository.assignVehicleToDriver(vehicleId, driverId, vehicle.ownerId);
  }

  async getFleetPerformance(ownerId, period = '30d', requestingUserId = null, requestingRole = null) {
    if (requestingUserId && requestingRole !== ROLES.ADMIN) {
      if (ownerId !== requestingUserId) {
        throw ForbiddenException.notOwner();
      }
    }

    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.repository.getFleetStats(ownerId);
    const utilization = await this.repository.getVehicleUtilization(ownerId, days);

    const ownerVehicles = await prisma.vehicle.findMany({
      where: { ownerId },
      select: { id: true, driverId: true }
    });
    
    const vehicleIds = ownerVehicles.map(v => v.id);
    
    if (vehicleIds.length === 0) {
      return {
        period,
        days,
        stats,
        performance: {
          completedTrips: 0,
          totalRevenue: 0,
          averagePerTrip: 0,
          utilizationRate: 0
        },
        vehicleUtilization: utilization
      };
    }

    const fleetDriverIds = [...new Set(ownerVehicles.map(v => v.driverId).filter(id => id !== null))];

    const ridePools = await prisma.ridePool.findMany({
      where: {
        vehicleId: { in: vehicleIds },
        createdAt: { gte: startDate }
      },
      include: {
        bookings: {
          where: { status: { in: ['COMPLETED', 'PAID'] } }
        }
      }
    });

    const completedTrips = ridePools.filter(r => r.bookings.length > 0);
    const totalRevenue = completedTrips.reduce((sum, r) => {
      return sum + r.bookings.reduce((s, b) => s + b.totalAmount, 0);
    }, 0);

    return {
      period,
      days,
      stats,
      performance: {
        completedTrips: completedTrips.length,
        totalRevenue,
        averagePerTrip: completedTrips.length > 0 ? totalRevenue / completedTrips.length : 0,
        utilizationRate: utilization.length > 0 
          ? utilization.reduce((s, v) => s + (parseFloat(v.utilizationRate) || 0), 0) / utilization.length 
          : 0
      },
      vehicleUtilization: utilization
    };
  }

  parsePeriod(period) {
    const match = period.match(/^(\d+)d$/);
    if (match) {
      return parseInt(match[1]);
    }
    return 30;
  }
}

module.exports = new FleetService();
