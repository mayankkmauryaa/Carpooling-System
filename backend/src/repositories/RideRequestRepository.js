const { prisma } = require('../database/connection');

class RideRequestRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.rideRequest.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.rideRequest.findFirst({
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
    
    return await prisma.rideRequest.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.rideRequest.count({ where: query });
  }

  async create(data) {
    return await prisma.rideRequest.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.rideRequest.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.rideRequest.delete({ where: { id } });
  }

  async exists(query) {
    const request = await prisma.rideRequest.findFirst({ where: query, select: { id: true } });
    return !!request;
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
    
    const items = await prisma.rideRequest.findMany({
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

  async findByRide(ridePoolId, options = {}) {
    return await this.findAll({ ridePoolId }, {
      ...options,
      include: { rider: { select: { firstName: true, lastName: true, rating: true } } }
    });
  }

  async findByRider(riderId, options = {}) {
    return await this.findAll({ riderId }, {
      ...options,
      include: { 
        ridePool: { 
          include: { 
            driver: { select: { firstName: true, lastName: true, rating: true } },
            vehicle: { select: { model: true, color: true } }
          }
        }
      }
    });
  }

  async hasActiveRequest(ridePoolId, riderId) {
    const request = await prisma.rideRequest.findFirst({
      where: {
        ridePoolId,
        riderId,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });
    return !!request;
  }

  async approve(requestId) {
    return await this.updateById(requestId, {
      status: 'APPROVED',
      approvedAt: new Date()
    });
  }

  async reject(requestId, reason) {
    return await this.updateById(requestId, {
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectionReason: reason
    });
  }

  async cancel(requestId) {
    return await this.updateById(requestId, { status: 'CANCELLED' });
  }

  async findPendingRequest(ridePoolId, riderId) {
    return await this.findOne({
      ridePoolId,
      riderId,
      status: 'PENDING'
    });
  }
}

module.exports = new RideRequestRepository();
