const BaseService = require('./base/BaseService');
const { rideRepository, vehicleRepository, userRepository, rideRequestRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, ConflictException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const { generateS2CellId } = require('../utils/helpers');
const logger = require('../middleware/logger');
const { calculateDistance, calculateRouteMatchPercentage, filterByPreferences } = require('../utils/helpers');

class RideService extends BaseService {
  constructor() {
    super(rideRepository);
  }

  async create(driverId, rideData) {
    const user = await userRepository.findById(driverId);
    
    if (!user || user.role !== ROLES.DRIVER) {
      throw ForbiddenException.requireDriver();
    }

    const vehicle = await vehicleRepository.findById(rideData.vehicleId);
    if (!vehicle || vehicle.driverId.toString() !== driverId.toString()) {
      throw BadRequestException.invalidField('vehicle', 'Invalid vehicle');
    }

    const enrichedData = {
      ...rideData,
      driverId,
      pickupLocation: {
        ...rideData.pickupLocation,
        s2CellId: generateS2CellId(rideData.pickupLocation.coordinates)
      },
      dropLocation: {
        ...rideData.dropLocation,
        s2CellId: generateS2CellId(rideData.dropLocation.coordinates)
      }
    };

    const ride = await this.repository.create(enrichedData);

    logger.info('Ride created', { rideId: ride._id, driverId });

    return ride;
  }

  async getMyRides(driverId, options = {}) {
    const { status, page = 1, limit = 10 } = options;
    
    const query = { driverId };
    if (status) {
      query.status = status;
    }

    return await this.paginate(query, {
      populate: 'vehicleId',
      page,
      limit
    });
  }

  async getRideById(rideId) {
    const ride = await this.repository.findById(rideId, {
      populate: [
        { path: 'driverId', select: 'firstName lastName rating totalReviews' },
        { path: 'vehicleId' }
      ]
    });

    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    return ride;
  }

  async updateRide(rideId, driverId, updates) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.driverId.toString() !== driverId.toString()) {
      throw ForbiddenException.notOwner();
    }

    const updated = await this.repository.updateById(rideId, updates);
    
    logger.info('Ride updated', { rideId });

    return updated;
  }

  async cancelRide(rideId, driverId) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.driverId.toString() !== driverId.toString()) {
      throw ForbiddenException.notOwner();
    }

    await this.repository.updateStatus(rideId, 'cancelled');
    await this.repository.cancelPendingRequests(rideId);

    logger.info('Ride cancelled', { rideId });

    return { message: 'Ride cancelled successfully' };
  }

  async searchRides(searchParams) {
    const {
      pickupLat, pickupLng, dropLat, dropLng,
      radius = 10, departureDate, availableSeats = 1,
      preferences, page = 1, limit = 10
    } = searchParams;

    const query = {
      status: 'active',
      availableSeats: { $gte: parseInt(availableSeats) }
    };

    if (departureDate) {
      const date = new Date(departureDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.departureTime = { $gte: date, $lt: nextDay };
    } else {
      query.departureTime = { $gte: new Date() };
    }

    let rides = await this.repository.findAll(query, {
      populate: [
        { path: 'driverId', select: 'firstName lastName rating totalReviews profilePicture isProfileBlurred' },
        { path: 'vehicleId', select: 'model color licensePlate' }
      ]
    });

    if (pickupLat && pickupLng && dropLat && dropLng) {
      const riderPickup = [parseFloat(pickupLng), parseFloat(pickupLat)];
      const riderDrop = [parseFloat(dropLng), parseFloat(dropLat)];

      rides = rides.map(ride => {
        const driverPickup = ride.pickupLocation.coordinates;
        const driverDrop = ride.dropLocation.coordinates;
        
        const matchPercentage = calculateRouteMatchPercentage(
          driverPickup, driverDrop, riderPickup, riderDrop
        );

        return { ...ride.toObject(), matchPercentage };
      });

      rides = rides.filter(ride => ride.matchPercentage >= 30);

      if (preferences) {
        rides = rides.filter(ride => filterByPreferences(ride.preferences, preferences));
      }

      rides.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    const total = rides.length;
    const startIndex = (page - 1) * limit;
    const paginatedRides = rides.slice(startIndex, startIndex + parseInt(limit));

    return {
      items: paginatedRides,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }

  async requestToJoin(rideId, riderId, requestData) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.status !== 'active') {
      throw BadRequestException.rideNotActive();
    }

    const hasRequest = await rideRequestRepository.hasActiveRequest(rideId, riderId);
    if (hasRequest) {
      throw ConflictException.alreadyHasRequest();
    }

    const request = await rideRequestRepository.create({
      ridePoolId: rideId,
      riderId,
      pickupLocation: requestData.pickupLocation,
      dropLocation: requestData.dropLocation
    });

    logger.info('Join request created', { requestId: request._id, rideId, riderId });

    return {
      requestId: request._id,
      status: request.status
    };
  }

  async respondToRequest(rideId, driverId, riderId, action, reason) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.driverId.toString() !== driverId.toString()) {
      throw ForbiddenException.notOwner();
    }

    const request = await rideRequestRepository.findPendingRequest(rideId, riderId);
    if (!request) {
      throw NotFoundException.request(`${rideId}-${riderId}`);
    }

    if (action === 'approve') {
      if (ride.availableSeats < 1) {
        throw BadRequestException.noSeatsAvailable();
      }

      await rideRequestRepository.approve(request._id);
      await this.repository.addPassenger(rideId, riderId);
      
      logger.info('Request approved', { requestId: request._id });
      
      return { message: 'Request approved' };
    } else {
      await rideRequestRepository.reject(request._id, reason || 'Driver rejected your request');
      
      logger.info('Request rejected', { requestId: request._id, reason });
      
      return { message: 'Request rejected' };
    }
  }

  async getRideRequests(rideId) {
    return await rideRequestRepository.findByRide(rideId);
  }

  async getMyRequests(riderId, options = {}) {
    return await rideRequestRepository.findByRider(riderId, options);
  }

  async cancelJoinRequest(rideId, riderId) {
    const request = await rideRequestRepository.findPendingRequest(rideId, riderId);
    
    if (!request) {
      throw NotFoundException.request();
    }

    await rideRequestRepository.cancel(request._id);

    return { message: 'Join request cancelled' };
  }

  async getRecommendations() {
    const rides = await this.repository.findUpcomingRides({
      limit: 10,
      populate: [
        { path: 'driverId', select: 'firstName rating' },
        { path: 'vehicleId', select: 'model color' }
      ]
    });

    return rides;
  }

  async getUpcomingRides(options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await this.paginate({
      status: 'active',
      departureTime: { $gte: new Date() }
    }, {
      populate: [
        { path: 'driverId', select: 'firstName lastName rating' },
        { path: 'vehicleId', select: 'model color' }
      ],
      page,
      limit,
      sort: { departureTime: 1 }
    });
  }

  async getNearbyRides(lat, lng, radius = 10) {
    const coordinates = [parseFloat(lng), parseFloat(lat)];
    
    return await this.repository.searchNearbyRides(coordinates, radius, {
      populate: [
        { path: 'driverId', select: 'firstName lastName rating' },
        { path: 'vehicleId', select: 'model color' }
      ],
      limit: 20
    });
  }

  async getRidesByDriver(driverId, options = {}) {
    const { status, page = 1, limit = 20 } = options;
    
    const query = { driverId };
    if (status) {
      query.status = status;
    }

    return await this.paginate(query, {
      populate: 'vehicleId',
      page,
      limit
    });
  }

  async getRidesByDate(date, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    return await this.paginate({
      departureTime: { $gte: startDate, $lt: endDate }
    }, {
      populate: [
        { path: 'driverId', select: 'firstName lastName rating' },
        { path: 'vehicleId', select: 'model color' }
      ],
      page,
      limit
    });
  }

  async updateRideStatus(rideId, status) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    const updated = await this.repository.updateById(rideId, { status });
    
    logger.info('Ride status updated', { rideId, status });

    return updated;
  }
}

module.exports = new RideService();
