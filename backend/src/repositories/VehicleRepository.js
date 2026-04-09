const { prisma } = require('../database/connection');

class VehicleRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.vehicle.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.vehicle.findFirst({
      where: query,
      include: include || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { 
      include, 
      orderBy = { createdAt: 'desc' }, 
      skip = 0, 
      take = 20 
    } = options;
    
    return await prisma.vehicle.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.vehicle.count({ where: query });
  }

  async create(data) {
    return await prisma.vehicle.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.vehicle.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.vehicle.delete({ where: { id } });
  }

  async exists(query) {
    const vehicle = await prisma.vehicle.findFirst({ where: query, select: { id: true } });
    return !!vehicle;
  }

  async paginate(query = {}, options = {}) {
    const { 
      include, 
      orderBy = { createdAt: 'desc' }, 
      page = 1, 
      limit = 20 
    } = options;
    
    const skip = (page - 1) * limit;
    const total = await this.count(query);
    
    const items = await prisma.vehicle.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take: limit
    });
    
    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async findByDriver(driverId, options = {}) {
    return await this.findAll({ driverId }, options);
  }

  async findByLicensePlate(licensePlate) {
    return await prisma.vehicle.findUnique({ 
      where: { licensePlate: licensePlate.toUpperCase() } 
    });
  }

  async licensePlateExists(licensePlate) {
    return await this.exists({ licensePlate: licensePlate.toUpperCase() });
  }

  async getAllWithFilters(options = {}) {
    const { page = 1, limit = 20, isActive, search, model, color } = options;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive;
    if (model) query.model = { contains: model, mode: 'insensitive' };
    if (color) query.color = { contains: color, mode: 'insensitive' };
    if (search) {
      query.OR = [
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } }
      ];
    }

    return await this.paginate(query, {
      include: { driver: true },
      page,
      limit,
      orderBy: { createdAt: 'desc' }
    });
  }

  async toggleStatus(id) {
    const vehicle = await this.findById(id);
    if (vehicle) {
      return await this.updateById(id, { isActive: !vehicle.isActive });
    }
    return null;
  }
}

module.exports = new VehicleRepository();
