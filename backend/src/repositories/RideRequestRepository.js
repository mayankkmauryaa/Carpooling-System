const BaseRepository = require('./base/BaseRepository');
const RideRequest = require('../models/RideRequest');

class RideRequestRepository extends BaseRepository {
  constructor() {
    super(RideRequest);
  }

  async findByRide(ridePoolId, options = {}) {
    return await this.findAll({ ridePoolId }, {
      ...options,
      populate: [{ path: 'riderId', select: 'firstName lastName rating' }]
    });
  }

  async findByRider(riderId, options = {}) {
    return await this.findAll({ riderId }, {
      ...options,
      populate: [{
        path: 'ridePoolId',
        populate: [
          { path: 'driverId', select: 'firstName lastName rating' },
          { path: 'vehicleId', select: 'model color' }
        ]
      }]
    });
  }

  async hasActiveRequest(ridePoolId, riderId) {
    return await this.exists({
      ridePoolId,
      riderId,
      status: { $in: ['pending', 'approved'] }
    });
  }

  async approve(requestId) {
    return await this.updateById(requestId, {
      status: 'approved',
      approvedAt: new Date()
    });
  }

  async reject(requestId, reason) {
    return await this.updateById(requestId, {
      status: 'rejected',
      rejectedAt: new Date(),
      rejectionReason: reason
    });
  }

  async cancel(requestId) {
    return await this.updateById(requestId, { status: 'cancelled' });
  }

  async findPendingRequest(ridePoolId, riderId) {
    return await this.findOne({
      ridePoolId,
      riderId,
      status: 'pending'
    });
  }
}

module.exports = new RideRequestRepository();
