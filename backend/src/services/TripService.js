const BaseService = require('./base/BaseService');
const { tripRepository, rideRepository, userRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const logger = require('../middleware/logger');

class TripService extends BaseService {
  constructor() {
    super(tripRepository);
  }

  async getMyTrips(userId, options = {}) {
    const { status, page = 1, limit = 10 } = options;
    
    const query = {
      $or: [{ driverId: userId }, { riderIds: userId }]
    };
    
    if (status) {
      query.status = status;
    }

    return await this.paginate(query, {
      populate: [
        'ridePoolId',
        { path: 'driverId', select: 'firstName lastName rating' },
        { path: 'riderIds', select: 'firstName lastName rating' }
      ],
      page,
      limit
    });
  }

  async getTripById(tripId, userId, userRole = 'rider') {
    const trip = await this.repository.findById(tripId, {
      populate: [
        'ridePoolId',
        { path: 'driverId', select: 'firstName lastName rating phone' },
        { path: 'riderIds', select: 'firstName lastName rating phone' }
      ]
    });

    if (!trip) {
      throw NotFoundException.trip(tripId);
    }

    const isParticipant = trip.driverId._id.toString() === userId.toString() ||
      trip.riderIds.some(r => r._id.toString() === userId.toString());

    if (!isParticipant && userRole !== 'admin') {
      throw ForbiddenException.notOwner();
    }

    return trip;
  }

  async startTrip(rideId, driverId) {
    const ride = await rideRepository.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.driverId.toString() !== driverId.toString()) {
      throw ForbiddenException.requireDriver();
    }

    if (ride.status !== 'active') {
      throw BadRequestException.rideNotActive();
    }

    const riderIds = ride.passengers
      .filter(p => p.status === 'confirmed')
      .map(p => p.userId);

    const trip = await this.repository.startTrip(ride._id, driverId, {
      riderIds,
      startLocation: ride.pickupLocation,
      totalFare: ride.pricePerSeat * riderIds.length
    });

    await rideRepository.updateStatus(rideId, 'completed');

    logger.info('Trip started', { tripId: trip._id });

    return trip;
  }

  async completeTrip(tripId, driverId, endData) {
    const trip = await this.findById(tripId);
    
    if (!trip) {
      throw NotFoundException.trip(tripId);
    }

    if (trip.driverId.toString() !== driverId.toString()) {
      throw ForbiddenException.requireDriver();
    }

    if (trip.status !== 'in-progress') {
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

    const isDriver = trip.driverId.toString() === userId.toString();
    const isRider = trip.riderIds.some(r => r.toString() === userId.toString());

    if (!isDriver && !isRider) {
      throw ForbiddenException.notOwner();
    }

    await this.repository.cancelTrip(tripId);

    return { message: 'Trip cancelled' };
  }

  async getAllTrips(options = {}) {
    const { page = 1, limit = 20, status, startDate, endDate } = options;
    
    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    return await this.paginate(query, {
      populate: [
        'ridePoolId',
        { path: 'driverId', select: 'firstName lastName email' },
        { path: 'riderIds', select: 'firstName lastName email' }
      ],
      page,
      limit
    });
  }

  async getTripsByDriver(driverId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    
    const query = { driverId };
    if (status) query.status = status;

    return await this.paginate(query, {
      populate: ['ridePoolId', { path: 'riderIds', select: 'firstName lastName' }],
      page,
      limit
    });
  }

  async getTripsByRider(riderId, options = {}) {
    const { page = 1, limit = 20, status } = options;
    
    const query = { riderIds: riderId };
    if (status) query.status = status;

    return await this.paginate(query, {
      populate: ['ridePoolId', { path: 'driverId', select: 'firstName lastName' }],
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

    return await this.paginate({
      $or: [{ driverId: userId }, { riderIds: userId }],
      status: 'scheduled'
    }, {
      populate: [
        'ridePoolId',
        { path: 'driverId', select: 'firstName lastName' },
        { path: 'riderIds', select: 'firstName lastName' }
      ],
      page,
      limit,
      sort: { startTime: 1 }
    });
  }

  async getTripStats() {
    const result = await this.model.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalFare' },
          totalDistance: { $sum: '$actualDistance' }
        }
      }
    ]);

    const stats = await this.repository.getStatsSimple();
    const { totalRevenue = 0, totalDistance = 0 } = result[0] || {};

    return {
      ...stats,
      totalRevenue,
      totalDistance
    };
  }

  async getTripsByDate(date, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    return await this.paginate({
      createdAt: { $gte: startDate, $lte: endDate }
    }, {
      populate: [
        'ridePoolId',
        { path: 'driverId', select: 'firstName lastName' },
        { path: 'riderIds', select: 'firstName lastName' }
      ],
      page,
      limit
    });
  }

  async getTripsByStatus(status, options = {}) {
    const { page = 1, limit = 20 } = options;

    return await this.paginate({ status }, {
      populate: [
        'ridePoolId',
        { path: 'driverId', select: 'firstName lastName' },
        { path: 'riderIds', select: 'firstName lastName' }
      ],
      page,
      limit
    });
  }
}

module.exports = new TripService();
