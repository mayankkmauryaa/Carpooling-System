const BaseService = require('./base/BaseService');
const { vehicleRepository, userRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, ConflictException } = require('../exceptions');
const { ROLES } = require('../constants/roles');
const logger = require('../middleware/logger');

class VehicleService extends BaseService {
  constructor() {
    super(vehicleRepository);
  }

  async create(userId, vehicleData) {
    const user = await userRepository.findById(userId);
    
    if (!user || user.role !== ROLES.DRIVER) {
      throw ForbiddenException.requireDriver();
    }

    if (await this.repository.licensePlateExists(vehicleData.licensePlate)) {
      throw ConflictException.duplicateKey('licensePlate');
    }

    const vehicle = await this.repository.create({
      ...vehicleData,
      driverId: userId
    });

    logger.info('Vehicle created', { vehicleId: vehicle.id, driverId: userId });

    return vehicle;
  }

  async getMyVehicles(userId) {
    return await this.repository.findByDriver(userId);
  }

  async getVehicleById(vehicleId) {
    const vehicle = await this.findById(vehicleId);
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }
    return vehicle;
  }

  async updateVehicle(vehicleId, userId, updates) {
    const vehicle = await this.findById(vehicleId);
    
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }

    if (vehicle.driverId !== userId) {
      throw ForbiddenException.notOwner();
    }

    const updated = await this.repository.updateById(vehicleId, updates);
    
    logger.info('Vehicle updated', { vehicleId });

    return updated;
  }

  async deleteVehicle(vehicleId, userId) {
    const vehicle = await this.findById(vehicleId);
    
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }

    if (vehicle.driverId !== userId) {
      throw ForbiddenException.notOwner();
    }

    await this.deleteById(vehicleId);
    
    logger.info('Vehicle deleted', { vehicleId });

    return { message: 'Vehicle deleted successfully' };
  }

  async getAllVehicles(options = {}) {
    return await this.repository.getAllWithFilters(options);
  }

  async toggleVehicleStatus(vehicleId, userId) {
    const vehicle = await this.findById(vehicleId);
    
    if (!vehicle) {
      throw NotFoundException.vehicle(vehicleId);
    }

    if (vehicle.driverId !== userId) {
      throw ForbiddenException.notOwner();
    }

    const updated = await this.repository.toggleStatus(vehicleId);
    
    logger.info('Vehicle status toggled', { vehicleId, isActive: updated.isActive });

    return updated;
  }

  async getVehiclesByDriver(driverId, options = {}) {
    return await this.repository.findByDriver(driverId, options);
  }
}

module.exports = new VehicleService();
