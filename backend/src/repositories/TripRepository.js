const { prisma } = require('../database/connection');

class TripRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.trip.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.trip.findFirst({
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
    
    return await prisma.trip.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.trip.count({ where: query });
  }

  async create(data) {
    return await prisma.trip.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.trip.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.trip.delete({ where: { id } });
  }

  async exists(query) {
    const trip = await prisma.trip.findFirst({ where: query, select: { id: true } });
    return !!trip;
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
    
    const items = await prisma.trip.findMany({
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

  async findByRidePool(ridePoolId) {
    return await this.findOne({ ridePoolId });
  }

  async startTrip(ridePoolId, driverId, startData) {
    return await this.create({
      ...startData,
      ridePoolId,
      driverId,
      startTime: new Date(),
      status: 'IN_PROGRESS'
    });
  }

  async completeTrip(tripId, endData) {
    return await this.updateById(tripId, {
      ...endData,
      endTime: new Date(),
      status: 'COMPLETED'
    });
  }

  async cancelTrip(tripId) {
    return await this.updateById(tripId, { status: 'CANCELLED' });
  }

  async getStatsSimple() {
    const [total, completed, cancelled, inProgress, scheduled] = await Promise.all([
      this.count({}),
      this.count({ status: 'COMPLETED' }),
      this.count({ status: 'CANCELLED' }),
      this.count({ status: 'IN_PROGRESS' }),
      this.count({ status: 'SCHEDULED' })
    ]);

    return { totalTrips: total, completedTrips: completed, cancelledTrips: cancelled, inProgressTrips: inProgress, scheduledTrips: scheduled };
  }

  async getTripStats() {
    return await prisma.trip.aggregate({
      _count: { _all: true },
      _sum: { totalFare: true, actualDistance: true },
      status: true
    });
  }
}

module.exports = new TripRepository();
