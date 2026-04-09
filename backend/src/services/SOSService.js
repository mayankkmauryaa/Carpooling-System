const BaseService = require('./base/BaseService');
const { sosRepository } = require('../repositories');
const { NotFoundException } = require('../exceptions');
const logger = require('../middleware/logger');

class SOSService extends BaseService {
  constructor() {
    super(sosRepository);
  }

  async createAlert(userId, alertData) {
    const alert = await this.repository.createAlert({
      userId,
      ...alertData,
      status: 'active'
    });

    logger.warn('SOS Alert Created', {
      alertId: alert._id,
      userId,
      ridePoolId: alertData.ridePoolId,
      location: alertData.location
    });

    return alert;
  }

  async getUserAlerts(userId, options = {}) {
    return await this.repository.findByUser(userId, options);
  }

  async getActiveAlerts(options = {}) {
    return await this.repository.findActiveAlerts(options);
  }

  async acknowledgeAlert(alertId, adminId) {
    const alert = await this.findById(alertId);
    
    if (!alert) {
      throw NotFoundException.sosAlert(alertId);
    }

    const updated = await this.repository.acknowledge(alertId, adminId);

    logger.info('SOS Alert Acknowledged', {
      alertId,
      acknowledgedBy: adminId
    });

    return updated;
  }

  async resolveAlert(alertId, adminId, notes = '') {
    const alert = await this.findById(alertId);
    
    if (!alert) {
      throw NotFoundException.sosAlert(alertId);
    }

    const updated = await this.repository.resolve(alertId, notes);

    logger.info('SOS Alert Resolved', {
      alertId,
      resolvedBy: adminId,
      notes
    });

    return updated;
  }

  async getAlertStats() {
    const [total, active, acknowledged, resolved] = await Promise.all([
      this.count({}),
      this.count({ status: 'active' }),
      this.count({ status: 'acknowledged' }),
      this.count({ status: 'resolved' })
    ]);

    return { total, active, acknowledged, resolved };
  }
}

module.exports = new SOSService();
