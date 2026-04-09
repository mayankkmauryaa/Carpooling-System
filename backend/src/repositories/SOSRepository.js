const BaseRepository = require('./base/BaseRepository');
const SOSAlert = require('../models/SOSAlert');

class SOSRepository extends BaseRepository {
  constructor() {
    super(SOSAlert);
  }

  async findByUser(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.find({ userId })
        .populate('ridePoolId', 'startLocation dropLocation departureTime')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      this.count({ userId })
    ]);

    return {
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }

  async findByRidePool(ridePoolId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.find({ ridePoolId })
        .populate('userId', 'firstName lastName phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      this.count({ ridePoolId })
    ]);

    return {
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }

  async findActiveAlerts(options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.find({ status: 'active' })
        .populate('userId', 'firstName lastName phone')
        .populate('ridePoolId', 'startLocation dropLocation departureTime')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      this.count({ status: 'active' })
    ]);

    return {
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }

  async acknowledge(alertId, adminId) {
    return await this.updateById(alertId, {
      status: 'acknowledged',
      acknowledgedBy: adminId,
      acknowledgedAt: new Date()
    });
  }

  async resolve(alertId, notes = '') {
    return await this.updateById(alertId, {
      status: 'resolved',
      notes,
      resolvedAt: new Date()
    });
  }

  async createAlert(alertData) {
    return await this.create(alertData);
  }
}

module.exports = new SOSRepository();
