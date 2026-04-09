const BaseRepository = require('./base/BaseRepository');
const Vehicle = require('../models/Vehicle');

class VehicleRepository extends BaseRepository {
  constructor() {
    super(Vehicle);
  }

  async findByDriver(driverId, options = {}) {
    return await this.findAll({ driverId }, options);
  }

  async licensePlateExists(licensePlate) {
    return await this.exists({ licensePlate: licensePlate.toUpperCase() });
  }

  async getAllWithFilters(options = {}) {
    const { page = 1, limit = 20, isActive, search, model, color } = options;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive;
    if (model) query.model = { $regex: model, $options: 'i' };
    if (color) query.color = { $regex: color, $options: 'i' };
    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { licensePlate: { $regex: search, $options: 'i' } }
      ];
    }

    return await this.paginate(query, {
      populate: 'driverId',
      page,
      limit,
      sort: { createdAt: -1 }
    });
  }

  async toggleStatus(id) {
    const vehicle = await this.findById(id);
    if (vehicle) {
      vehicle.isActive = !vehicle.isActive;
      return await vehicle.save();
    }
    return null;
  }
}

module.exports = new VehicleRepository();
