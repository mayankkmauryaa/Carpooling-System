const { prisma } = require('../database/connection');

class SOSRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.sOSAlert.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.sOSAlert.findFirst({
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
    
    return await prisma.sOSAlert.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.sOSAlert.count({ where: query });
  }

  async create(data) {
    return await prisma.sOSAlert.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.sOSAlert.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.sOSAlert.delete({ where: { id } });
  }

  async exists(query) {
    const alert = await prisma.sOSAlert.findFirst({ where: query, select: { id: true } });
    return !!alert;
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
    
    const items = await prisma.sOSAlert.findMany({
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

  async findByUser(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.sOSAlert.findMany({
        where: { userId },
        include: { 
          ridePool: { select: { pickupLocation: true, dropLocation: true, departureTime: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
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
      prisma.sOSAlert.findMany({
        where: { ridePoolId },
        include: { 
          user: { select: { firstName: true, lastName: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
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
      prisma.sOSAlert.findMany({
        where: { status: 'ACTIVE' },
        include: { 
          user: { select: { firstName: true, lastName: true, phone: true } },
          ridePool: { select: { pickupLocation: true, dropLocation: true, departureTime: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.count({ status: 'ACTIVE' })
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
      status: 'ACKNOWLEDGED',
      acknowledgedBy: adminId,
      acknowledgedAt: new Date()
    });
  }

  async resolve(alertId, notes = '') {
    return await this.updateById(alertId, {
      status: 'RESOLVED',
      notes,
      resolvedAt: new Date()
    });
  }

  async createAlert(alertData) {
    return await this.create(alertData);
  }
}

module.exports = new SOSRepository();
