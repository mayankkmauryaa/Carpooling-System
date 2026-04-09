const { prisma } = require('../database/connection');

class RideRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.ridePool.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.ridePool.findFirst({
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
    
    return await prisma.ridePool.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.ridePool.count({ where: query });
  }

  async create(data) {
    return await prisma.ridePool.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.ridePool.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.ridePool.delete({ where: { id } });
  }

  async exists(query) {
    const ride = await prisma.ridePool.findFirst({ where: query, select: { id: true } });
    return !!ride;
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
    
    const items = await prisma.ridePool.findMany({
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

  async findUpcomingRides(options = {}) {
    const query = {
      status: 'ACTIVE',
      departureTime: { gte: new Date() }
    };
    return await this.findAll(query, {
      ...options,
      orderBy: { departureTime: 'asc' }
    });
  }

  async searchNearbyRides(coordinates, radiusKm, options = {}) {
    const lat = coordinates[1];
    const lng = coordinates[0];
    const radiusDegrees = radiusKm / 111;
    
    const rides = await prisma.ridePool.findMany({
      where: {
        status: 'ACTIVE',
        departureTime: { gte: new Date() },
        AND: [
          { pickupLocation: { path: ['coordinates', 1], gte: lat - radiusDegrees } },
          { pickupLocation: { path: ['coordinates', 1], lte: lat + radiusDegrees } },
          { pickupLocation: { path: ['coordinates', 0], gte: lng - radiusDegrees } },
          { pickupLocation: { path: ['coordinates', 0], lte: lng + radiusDegrees } }
        ]
      },
      take: options.limit || 20,
      orderBy: { departureTime: 'asc' }
    });
    
    return rides;
  }

  async addPassenger(rideId, userId) {
    const ride = await this.findById(rideId);
    if (!ride) return null;
    
    const passengers = typeof ride.passengers === 'string' 
      ? JSON.parse(ride.passengers) 
      : ride.passengers || [];
    
    passengers.push({ userId, status: 'confirmed', joinedAt: new Date().toISOString() });
    
    return await this.updateById(rideId, {
      availableSeats: ride.availableSeats - 1,
      bookedSeats: ride.bookedSeats + 1,
      passengers: JSON.stringify(passengers)
    });
  }

  async removePassenger(rideId, userId) {
    const ride = await this.findById(rideId);
    if (!ride) return null;
    
    let passengers = typeof ride.passengers === 'string' 
      ? JSON.parse(ride.passengers) 
      : ride.passengers || [];
    
    passengers = passengers.filter(p => p.userId !== userId);
    
    return await this.updateById(rideId, {
      availableSeats: ride.availableSeats + 1,
      bookedSeats: ride.bookedSeats - 1,
      passengers: JSON.stringify(passengers)
    });
  }

  async cancelPendingRequests(rideId) {
    return await prisma.rideRequest.updateMany({
      where: { ridePoolId: rideId, status: 'PENDING' },
      data: { status: 'CANCELLED' }
    });
  }

  async updateStatus(id, status) {
    return await this.updateById(id, { status: status.toUpperCase() });
  }
}

module.exports = new RideRepository();
