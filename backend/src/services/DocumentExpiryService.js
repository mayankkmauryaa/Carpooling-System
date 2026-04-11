const driverDocumentService = require('./DriverDocumentService');
const vehicleDocumentService = require('./VehicleDocumentService');
const ownerDocumentService = require('./OwnerDocumentService');
const logger = require('../middleware/logger');

class DocumentExpiryService {
  constructor() {
    this.intervalId = null;
    this.checkInterval = 24 * 60 * 60 * 1000;
    this.isRunning = false;
  }

  async markExpiredDocuments() {
    try {
      logger.info('Starting document expiry check...');

      const expiredDrivers = await driverDocumentService.markExpiredDocuments();
      const expiredVehicles = await vehicleDocumentService.markExpiredDocuments();
      const expiredOwners = await ownerDocumentService.markExpiredDocuments();

      logger.info('Document expiry check completed', {
        expiredDrivers: expiredDrivers.length,
        expiredVehicles: expiredVehicles.length,
        expiredOwners: expiredOwners.length
      });

      return {
        expiredDriverDocuments: expiredDrivers.length,
        expiredVehicleDocuments: expiredVehicles.length,
        expiredOwnerDocuments: expiredOwners.length
      };
    } catch (error) {
      logger.error('Error during document expiry check:', error);
      throw error;
    }
  }

  async getExpiringDocuments(daysThreshold = 30) {
    try {
      const expiringDrivers = await driverDocumentService.checkExpiringDocuments(daysThreshold);
      const expiringVehicles = await vehicleDocumentService.checkExpiringDocuments(daysThreshold);
      const expiringOwners = await ownerDocumentService.checkExpiringDocuments(daysThreshold);

      return {
        expiringDrivers,
        expiringVehicles,
        expiringOwners,
        summary: {
          totalExpiringDrivers: expiringDrivers.length,
          totalExpiringVehicles: expiringVehicles.length,
          totalExpiringOwners: expiringOwners.length
        }
      };
    } catch (error) {
      logger.error('Error getting expiring documents:', error);
      throw error;
    }
  }

  start() {
    if (this.isRunning) {
      logger.warn('Document expiry service is already running');
      return;
    }

    logger.info('Starting document expiry service...');
    
    this.intervalId = setInterval(async () => {
      try {
        await this.markExpiredDocuments();
      } catch (error) {
        logger.error('Document expiry service error:', error);
      }
    }, this.checkInterval);

    this.intervalId.unref();
    this.isRunning = true;

    this.runOnce();
  }

  async runOnce() {
    try {
      await this.markExpiredDocuments();
    } catch (error) {
      logger.error('Initial document expiry check failed:', error);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.info('Document expiry service stopped');
    }
  }

  isServiceRunning() {
    return this.isRunning;
  }
}

module.exports = new DocumentExpiryService();
