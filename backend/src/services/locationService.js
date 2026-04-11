const { prisma } = require('../database/connection');
const logger = require('../middleware/logger');

class LocationService {
  async recordDriverLocation(driverId, locationData) {
    const { latitude, longitude, heading, speed, accuracy } = locationData;

    const driverLocation = await prisma.driverLocation.updateMany({
      where: { driverId, isActive: true },
      data: { isActive: false }
    });

    const newLocation = await prisma.driverLocation.create({
      data: {
        driverId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        isActive: true
      }
    });

    await prisma.locationHistory.create({
      data: {
        driverId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        locationType: 'DRIVER_LOCATION'
      }
    });

    logger.debug('Driver location recorded', { driverId, latitude, longitude });

    return newLocation;
  }

  async getDriverCurrentLocation(driverId) {
    return await prisma.driverLocation.findFirst({
      where: { driverId, isActive: true }
    });
  }

  async getDriverLocationHistory(driverId, options = {}) {
    const { limit = 100, startDate, endDate } = options;

    const where = { driverId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    return await prisma.driverLocation.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  async getLocationHistory(driverId, options = {}) {
    const { limit = 100, startDate, endDate, locationType } = options;

    const where = { driverId };
    
    if (locationType) {
      where.locationType = locationType;
    }
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    return await prisma.locationHistory.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }

  async recordLocationPoint(driverId, locationData, type = 'DRIVER_LOCATION', relatedId = null) {
    const { latitude, longitude, heading, speed, accuracy } = locationData;

    return await prisma.locationHistory.create({
      data: {
        driverId,
        latitude,
        longitude,
        heading,
        speed,
        accuracy,
        locationType: type,
        relatedId
      }
    });
  }

  async findConflictingBookings(vehicleId, startDate, endDate, excludeBookingId = null) {
    const where = {
      ridePool: { vehicleId },
      status: { in: ['CONFIRMED', 'PENDING'] },
      AND: [
        {
          OR: [
            { startDate: { lte: endDate }, endDate: { gte: startDate } },
            { startDate: null, endDate: null }
          ]
        }
      ]
    };

    if (excludeBookingId) {
      where.NOT = { id: excludeBookingId };
    }

    return await prisma.booking.findMany({
      where,
      include: {
        ridePool: true,
        rider: { select: { firstName: true, lastName: true } }
      }
    });
  }

  async isVehicleAvailable(vehicleId, startDate, endDate, excludeBookingId = null) {
    const conflicts = await this.findConflictingBookings(vehicleId, startDate, endDate, excludeBookingId);
    return conflicts.length === 0;
  }

  async cleanupOldLocations(maxAgeInDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    const driverLocations = await prisma.driverLocation.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        isActive: false
      }
    });

    const locationHistory = await prisma.locationHistory.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        locationType: 'DRIVER_LOCATION'
      }
    });

    logger.info('Cleaned up old locations', {
      driverLocations: driverLocations.count,
      locationHistory: locationHistory.count
    });

    return { driverLocations: driverLocations.count, locationHistory: locationHistory.count };
  }
}

module.exports = new LocationService();
