const BaseService = require('./base/BaseService');
const { rideRepository, vehicleRepository, userRepository, rideRequestRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, ConflictException, BadRequestException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const { generateS2CellId, calculateDistance, calculateRouteMatchPercentage, filterByPreferences } = require('../utils/helpers');
const mapsService = require('./mapsService');
const logger = require('../middleware/logger');

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
    if (!vehicle || vehicle.driverId !== driverId) {
      throw BadRequestException.invalidField('vehicle', 'Invalid vehicle');
    }

    const enrichedData = {
      ...rideData,
      driverId,
      pickupLocation: {
        type: 'Point',
        coordinates: rideData.pickupLocation.coordinates,
        address: rideData.pickupLocation.address,
        s2CellId: generateS2CellId(rideData.pickupLocation.coordinates)
      },
      dropLocation: {
        type: 'Point',
        coordinates: rideData.dropLocation.coordinates,
        address: rideData.dropLocation.address,
        s2CellId: generateS2CellId(rideData.dropLocation.coordinates)
      }
    };

    const ride = await this.repository.create(enrichedData);

    logger.info('Ride created', { rideId: ride.id, driverId });

    return ride;
  }

  async getMyRides(driverId, options = {}) {
    const { status, page = 1, limit = 10 } = options;
    
    const query = { driverId };
    if (status) {
      query.status = status.toUpperCase();
    }

    return await this.repository.paginate(query, {
      include: { vehicle: true },
      page,
      limit
    });
  }

  async getRideById(rideId) {
    const ride = await this.repository.findById(rideId, {
      include: {
        driver: { select: { firstName: true, lastName: true, rating: true, totalReviews: true } },
        vehicle: true
      }
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

    if (ride.driverId !== driverId) {
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

    if (ride.driverId !== driverId) {
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
      status: 'ACTIVE',
      availableSeats: { gte: parseInt(availableSeats) },
      departureTime: { gte: new Date() }
    };

    if (departureDate) {
      const date = new Date(departureDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      query.departureTime = { gte: date, lt: nextDay };
    }

    let rides = await this.repository.findAll(query, {
      include: {
        driver: { select: { firstName: true, lastName: true, rating: true, totalReviews: true, profilePicture: true, isProfileBlurred: true } },
        vehicle: { select: { brand: true, model: true, color: true, licensePlate: true } }
      }
    });

    if (pickupLat && pickupLng && dropLat && dropLng) {
      const riderPickup = [parseFloat(pickupLng), parseFloat(pickupLat)];
      const riderDrop = [parseFloat(dropLng), parseFloat(dropLat)];

      rides = await Promise.all(rides.map(async ride => {
        const driverPickup = ride.pickupLocation.coordinates;
        const driverDrop = ride.dropLocation.coordinates;
        
        const matchPercentage = calculateRouteMatchPercentage(
          driverPickup, driverDrop, riderPickup, riderDrop
        );

        let distanceInfo = null;
        let etaInfo = null;

        try {
          const distanceResult = await mapsService.getDistanceAndDuration(
            { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
            { lat: driverPickup[1], lng: driverPickup[0] }
          );
          distanceInfo = {
            distanceToPickup: distanceResult.distance.value / 1000,
            distanceToPickupText: distanceResult.distance.text
          };

          const etaResult = await mapsService.getDirections(
            { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
            { lat: parseFloat(dropLat), lng: parseFloat(dropLng) }
          );
          etaInfo = {
            totalDistance: etaResult.distance.value / 1000,
            totalDistanceText: etaResult.distance.text,
            estimatedDuration: etaResult.duration.value,
            estimatedDurationText: etaResult.duration.text,
            estimatedDurationInTraffic: etaResult.durationInTraffic ? etaResult.durationInTraffic.value : null,
            routePolyline: etaResult.overviewPath
          };
        } catch (error) {
          logger.warn('Google Maps API failed, using fallback', { error: error.message });
        }

        return { 
          ...ride, 
          matchPercentage,
          distanceToPickup: distanceInfo?.distanceToPickup || 0,
          distanceToPickupText: distanceInfo?.distanceToPickupText || 'N/A',
          totalDistance: etaInfo?.totalDistance || 0,
          totalDistanceText: etaInfo?.totalDistanceText || 'N/A',
          estimatedDuration: etaInfo?.estimatedDuration || 0,
          estimatedDurationText: etaInfo?.estimatedDurationText || 'N/A'
        };
      }));

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

    if (ride.status !== 'ACTIVE') {
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

    logger.info('Join request created', { requestId: request.id, rideId, riderId });

    return {
      requestId: request.id,
      status: request.status
    };
  }

  async respondToRequest(rideId, driverId, riderId, action, reason) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    if (ride.driverId !== driverId) {
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

      await rideRequestRepository.approve(request.id);
      await this.repository.addPassenger(rideId, riderId);
      
      logger.info('Request approved', { requestId: request.id });
      
      return { message: 'Request approved' };
    } else {
      await rideRequestRepository.reject(request.id, reason || 'Driver rejected your request');
      
      logger.info('Request rejected', { requestId: request.id, reason });
      
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

    await rideRequestRepository.cancel(request.id);

    return { message: 'Join request cancelled' };
  }

  async getRecommendations() {
    const rides = await this.repository.findUpcomingRides({
      take: 10,
      include: {
        driver: { select: { firstName: true, rating: true } },
        vehicle: { select: { model: true, color: true } }
      }
    });

    return rides;
  }

  async getUpcomingRides(options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await this.repository.paginate({
      status: 'ACTIVE',
      departureTime: { gte: new Date() }
    }, {
      include: {
        driver: { select: { firstName: true, lastName: true, rating: true } },
        vehicle: { select: { model: true, color: true } }
      },
      page,
      limit,
      orderBy: { departureTime: 'asc' }
    });
  }

  async getNearbyRides(lat, lng, radius = 10) {
    const coordinates = [parseFloat(lng), parseFloat(lat)];
    
    return await this.repository.searchNearbyRides(coordinates, radius, {
      limit: 20
    });
  }

  async getRidesByDriver(driverId, options = {}) {
    const { status, page = 1, limit = 20 } = options;
    
    const query = { driverId };
    if (status) {
      query.status = status.toUpperCase();
    }

    return await this.repository.paginate(query, {
      include: { vehicle: true },
      page,
      limit
    });
  }

  async getRidesByDate(date, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    return await this.repository.paginate({
      departureTime: { gte: startDate, lt: endDate }
    }, {
      include: {
        driver: { select: { firstName: true, lastName: true, rating: true } },
        vehicle: { select: { model: true, color: true } }
      },
      page,
      limit
    });
  }

  async updateRideStatus(rideId, status) {
    const ride = await this.findById(rideId);
    
    if (!ride) {
      throw NotFoundException.ride(rideId);
    }

    const updated = await this.repository.updateById(rideId, { status: status.toUpperCase() });
    
    logger.info('Ride status updated', { rideId, status });

    return updated;
  }
}

module.exports = new RideService();
