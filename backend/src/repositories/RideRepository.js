const BaseRepository = require('./base/BaseRepository');
const RidePool = require('../models/RidePool');
const RideRequest = require('../models/RideRequest');

class RideRepository extends BaseRepository {
  constructor() {
    super(RidePool);
  }

  async findUpcomingRides(options = {}) {
    const query = {
      status: 'active',
      departureTime: { $gte: new Date() }
    };
    return await this.findAll(query, {
      ...options,
      sort: { departureTime: 1 }
    });
  }

  async searchNearbyRides(coordinates, radiusKm, options = {}) {
    const { maxDistance = radiusKm * 1000 } = options;
    
    return await this.model.find({
      status: 'active',
      departureTime: { $gte: new Date() },
      pickupLocation: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates
          },
          $maxDistance: maxDistance
        }
      }
    }).limit(options.limit || 20);
  }

  async addPassenger(rideId, userId) {
    return await this.model.findByIdAndUpdate(
      rideId,
      {
        $inc: { availableSeats: -1, bookedSeats: 1 },
        $push: { passengers: { userId, status: 'confirmed', joinedAt: new Date() } }
      },
      { new: true }
    );
  }

  async removePassenger(rideId, userId) {
    return await this.model.findByIdAndUpdate(
      rideId,
      {
        $inc: { availableSeats: 1, bookedSeats: -1 },
        $pull: { passengers: { userId } }
      },
      { new: true }
    );
  }

  async cancelPendingRequests(rideId) {
    return await RideRequest.updateMany(
      { ridePoolId: rideId, status: 'pending' },
      { status: 'cancelled' }
    );
  }

  async updateStatus(id, status) {
    return await this.updateById(id, { status });
  }
}

module.exports = new RideRepository();
