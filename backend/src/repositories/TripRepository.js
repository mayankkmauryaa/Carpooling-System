const BaseRepository = require('./base/BaseRepository');
const Trip = require('../models/Trip');

class TripRepository extends BaseRepository {
  constructor() {
    super(Trip);
  }

  async findByRidePool(ridePoolId) {
    return await this.findOne({ ridePoolId });
  }

  async startTrip(ridePoolId, driverId, startData) {
    return await this.create({
      ...startData,
      ridePoolId,
      driverId,
      startTime: new Date(),
      status: 'in-progress'
    });
  }

  async completeTrip(tripId, endData) {
    return await this.updateById(tripId, {
      ...endData,
      endTime: new Date(),
      status: 'completed'
    });
  }

  async cancelTrip(tripId) {
    return await this.updateById(tripId, { status: 'cancelled' });
  }

  async getStatsSimple() {
    const [total, completed, cancelled, inProgress, scheduled] = await Promise.all([
      this.count({}),
      this.count({ status: 'completed' }),
      this.count({ status: 'cancelled' }),
      this.count({ status: 'in-progress' }),
      this.count({ status: 'scheduled' })
    ]);

    return { totalTrips: total, completedTrips: completed, cancelledTrips: cancelled, inProgressTrips: inProgress, scheduledTrips: scheduled };
  }
}

module.exports = new TripRepository();
