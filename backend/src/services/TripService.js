const BaseService = require('./base/BaseService');
const { tripRepository, rideRepository, userRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const { prisma } = require('../database/connection');
const logger = require('../middleware/logger');

class TripService extends BaseService {
  constructor() {
    super(tripRepository);
  }

  async getMyTrips(userId, options = {}) {
    const { status, page = 1, limit = 10 } = options;
    
    const query = {
      OR: [{ driverId: userId }, { riderIds: { has: userId } }]
    };
    
    if (status) {
      query.status = status.toUpperCase();
    }

    return await this.repository.paginate(query, {
      include: {
        ridePool: true,
        driver: { select: { firstName: true, lastName: true, rating: true } },
        riders: { select: { firstName: true, lastName: true, rating: true } }
      },
      page,
      limit
    });
  }

  async getTripById(tripId, userId, userRole = 'RIDER') {
    const trip = await this.repository.findById(tripId, {
      include: {
        ridePool: true,
        driver: { select: { firstName: true, lastName: true, rating: true, phone: true } },
        riders: { select: { firstName: true, lastName: true, rating: true, phone: true } }
      }
    });

    if (!trip) {
      throw NotFoundException.trip(tripId);
    }

    const isParticipant = trip.driverId === userId || trip.riderIds.includes(userId);

    if (!isParticipant && userRole !== 'ADMIN') {
      throw ForbiddenException.notOwner();
    }

    return trip;
  }

  async startTrip(rideId, driverId) {
    const ride = await rideRepository.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.driverId !== driverId) {
      throw ForbiddenException.requireDriver();
    }

    if (ride.status !== 'ACTIVE') {
      throw BadRequestException.rideNotActive();
    }

    let passengers = [];
    if (typeof ride.passengers === 'string') {
      try {
        passengers = JSON.parse(ride.passengers);
      } catch (parseError) {
        logger.error('Failed to parse passengers JSON', {
          rideId: ride.id,
          error: parseError.message,
          rawValue: ride.passengers
        });
        passengers = [];
      }
    } else {
      passengers = ride.passengers || [];
    }

    const riderIds = passengers
      .filter(p => p.status === 'confirmed')
      .map(p => p.userId);

    const trip = await this.repository.startTrip(ride.id, driverId, {
      riderIds,
      startLocation: ride.pickupLocation,
      totalFare: ride.pricePerSeat * riderIds.length
    });

    await rideRepository.updateStatus(rideId, 'completed');

    logger.info('Trip started', { tripId: trip.id });

    return trip;
  }

  async completeTrip(tripId, driverId, endData) {
    const trip = await this.findById(tripId);
    
    if (!trip) {
      throw NotFoundException.trip(tripId);
    }

    if (trip.driverId !== driverId) {
      throw ForbiddenException.requireDriver();
    }

    if (trip.status !== 'IN_PROGRESS') {
      throw BadRequestException.tripNotInProgress();
    }

    const updated = await this.repository.completeTrip(tripId, endData);

    logger.info('Trip completed', { tripId });

    return updated;
  }

  async cancelTrip(tripId, userId) {
    const trip = await this.findById(tripId);
    
    if (!trip) {
      throw NotFoundException.trip(tripId);
    }

    const isDriver = trip.driverId === userId;
    const isRider = trip.riderIds.includes(userId);

    if (!isDriver && !isRider) {
      throw ForbiddenException.notOwner();
    }

    await this.repository.cancelTrip(tripId);

    return { message: 'Trip cancelled' };
  }

  async getAllTrips(options = {}) {
    const { page = 1, limit = 20, status, startDate, endDate } = options;
    
    const query = {};
    if (status) query.status = status.toUpperCase();
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.gte = new Date(startDate);
      if (endDate) query.createdAt.lte = new Date(endDate);
    }

    return await this.repository.paginate(query, {
      include: {
        ridePool: true,
        driver: { select: { firstName: true, lastName: true, email: true } },
        riders: { select: { firstName: true, lastName: true, email: true } }
      },
      page,
      limit
    });
  }

  async getTripsByDriver(driverId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    
    const query = { driverId };
    if (status) query.status = status.toUpperCase();

    return await this.repository.paginate(query, {
      include: { 
        ridePool: true,
        riders: { select: { firstName: true, lastName: true } }
      },
      page,
      limit
    });
  }

  async getTripsByRider(riderId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    
    const query = { riderIds: { has: riderId } };
    if (status) query.status = status.toUpperCase();

    return await this.repository.paginate(query, {
      include: { 
        ridePool: true,
        driver: { select: { firstName: true, lastName: true } }
      },
      page,
      limit
    });
  }

  async getTripByRidePool(ridePoolId) {
    const trip = await this.repository.findByRidePool(ridePoolId);
    
    if (!trip) {
      throw NotFoundException.trip(ridePoolId);
    }

    return trip;
  }

  async getUpcomingTrips(userId, options = {}) {
    const { page = 1, limit = 20 } = options;

    return await this.repository.paginate({
      OR: [{ driverId: userId }, { riderIds: { has: userId } }],
      status: 'SCHEDULED'
    }, {
      include: {
        ridePool: true,
        driver: { select: { firstName: true, lastName: true } },
        riders: { select: { firstName: true, lastName: true } }
      },
      page,
      limit,
      orderBy: { startTime: 'asc' }
    });
  }

  async getTripStats() {
    const stats = await this.repository.getStatsSimple();
    
    const aggregateResult = await prisma.trip.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalFare: true, actualDistance: true }
    });

    return {
      ...stats,
      totalRevenue: aggregateResult._sum.totalFare || 0,
      totalDistance: aggregateResult._sum.actualDistance || 0
    };
  }

  async getTripsByDate(date, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return await this.repository.paginate({
      createdAt: { gte: startDate, lte: endDate }
    }, {
      include: {
        ridePool: true,
        driver: { select: { firstName: true, lastName: true } },
        riders: { select: { firstName: true, lastName: true } }
      },
      page,
      limit
    });
  }

  async getTripsByStatus(status, options = {}) {
    const { page = 1, limit = 20 } = options;

    return await this.repository.paginate({ status: status.toUpperCase() }, {
      include: {
        ridePool: true,
        driver: { select: { firstName: true, lastName: true } },
        riders: { select: { firstName: true, lastName: true } }
      },
      page,
      limit
    });
  }
}

module.exports = new TripService();
