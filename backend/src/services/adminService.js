const { prisma } = require('../database/connection');
const { BadRequestException, NotFoundException, ForbiddenException } = require('../exceptions');

class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      totalDrivers,
      totalRiders,
      activeDrivers,
      totalRides,
      activeRides,
      completedTrips,
      pendingTrips,
      totalVehicles,
      verifiedVehicles,
      pendingVehicles,
      totalReviews,
      avgRating,
      reportedUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'DRIVER' } }),
      prisma.user.count({ where: { role: 'RIDER' } }),
      prisma.user.count({ where: { role: 'DRIVER', isActive: true } }),
      prisma.ridePool.count(),
      prisma.ridePool.count({ where: { status: 'ACTIVE' } }),
      prisma.trip.count({ where: { status: 'COMPLETED' } }),
      prisma.trip.count({ where: { status: 'PENDING' } }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.vehicle.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.user.count({ where: { isSuspended: true } })
    ]);

    return {
      users: { total: totalUsers, drivers: totalDrivers, riders: totalRiders, activeDrivers },
      rides: { total: totalRides, active: activeRides },
      trips: { total: completedTrips + pendingTrips, completed: completedTrips, pending: pendingTrips },
      vehicles: { total: totalVehicles, verified: verifiedVehicles, pending: pendingVehicles },
      reviews: { total: totalReviews, averageRating: avgRating._avg.rating || 0 },
      reports: { suspendedUsers: reportedUsers }
    };
  }

  async getUserAnalytics(period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usersOverTime = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: startDate } }
    });

    const dailyStats = this.aggregateByDay(usersOverTime, days);

    return {
      period,
      totalNewUsers: await prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      dailyStats
    };
  }

  async getRideAnalytics(period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const ridesOverTime = await prisma.ridePool.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: { createdAt: { gte: startDate } }
    });

    const completedRides = await prisma.trip.findMany({
      where: { createdAt: { gte: startDate } },
      select: { totalFare: true, distance: true, estimatedDuration: true }
    });

    const totalRevenue = completedRides.reduce((sum, trip) => sum + trip.totalFare, 0);
    const totalDistance = completedRides.reduce((sum, trip) => sum + (trip.distance || 0), 0);
    const avgTripDuration = completedRides.length > 0
      ? completedRides.reduce((sum, trip) => sum + (trip.estimatedDuration || 0), 0) / completedRides.length
      : 0;

    return {
      period,
      totalRides: await prisma.ridePool.count({ where: { createdAt: { gte: startDate } } }),
      completedTrips: completedRides.length,
      totalRevenue,
      averageTripDuration: Math.round(avgTripDuration),
      totalDistance: Math.round(totalDistance),
      ridesOverTime: this.aggregateByDay(ridesOverTime, days)
    };
  }

  async getRevenueAnalytics(period = '30d') {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const completedTrips = await prisma.trip.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: startDate } },
      select: { totalFare: true, createdAt: true }
    });

    const revenueByDay = {};
    completedTrips.forEach(trip => {
      const day = trip.createdAt.toISOString().split('T')[0];
      revenueByDay[day] = (revenueByDay[day] || 0) + trip.totalFare;
    });

    const totalRevenue = completedTrips.reduce((sum, trip) => sum + trip.totalFare, 0);
    const averageRevenue = completedTrips.length > 0 ? totalRevenue / completedTrips.length : 0;

    return {
      period,
      totalRevenue,
      averageRevenuePerTrip: Math.round(averageRevenue * 100) / 100,
      totalTrips: completedTrips.length,
      revenueByDay
    };
  }

  async getPopularRoutes(limit = 10) {
    const trips = await prisma.trip.groupBy({
      by: ['pickupLocation', 'dropLocation'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    });

    return trips.map(route => ({
      pickup: route.pickupLocation,
      drop: route.dropLocation,
      tripCount: route._count.id
    }));
  }

  async getPeakHours() {
    const trips = await prisma.trip.findMany({
      select: { departureTime: true }
    });

    const hourCounts = {};
    trips.forEach(trip => {
      const hour = new Date(trip.departureTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return peakHours;
  }

  async getAllUsers(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.role) where.role = filters.role.toUpperCase();
    if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';
    if (filters.isSuspended !== undefined) where.isSuspended = filters.isSuspended === 'true';
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isSuspended: true,
          suspendedReason: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { tripsAsRider: true, tripsAsDriver: true, reviewsGiven: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserDetails(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vehicles: true,
        tripsAsRider: { take: 10, orderBy: { createdAt: 'desc' } },
        tripsAsDriver: { take: 10, orderBy: { createdAt: 'desc' } },
        reviewsGiven: { take: 10 },
        reviewsReceived: { take: 10 }
      }
    });

    if (!user) throw new NotFoundException('User not found');

    const receivedReviews = await prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { id: true }
    });

    return {
      ...user,
      averageRating: receivedReviews._avg.rating || 0,
      totalReviews: receivedReviews._count.id
    };
  }

  async updateUserStatus(userId, isActive, reason = '') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, isActive: true, firstName: true, lastName: true, email: true }
    });
  }

  async suspendUser(userId, reason) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new ForbiddenException('Cannot suspend admin users');

    return prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true, suspendedReason: reason },
      select: { id: true, isSuspended: true, suspendedReason: true, firstName: true, lastName: true, email: true }
    });
  }

  async unsuspendUser(userId) {
    return prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedReason: null },
      select: { id: true, isSuspended: true, suspendedReason: true, firstName: true, lastName: true, email: true }
    });
  }

  async deleteUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') throw new ForbiddenException('Cannot delete admin users');

    await prisma.user.delete({ where: { id: userId } });
    return { deleted: true, userId };
  }

  async getAllVehicles(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.isActive !== undefined) where.isActive = filters.isActive === 'true';
    if (filters.search) {
      where.OR = [
        { licensePlate: { contains: filters.search, mode: 'insensitive' } },
        { brand: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { driver: { select: { id: true, firstName: true, lastName: true, email: true } } }
      }),
      prisma.vehicle.count({ where })
    ]);

    return {
      vehicles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getVehicleDetails(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        ridePools: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async createVehicle(vehicleData) {
    const { driverId, brand, model, licensePlate, color, capacity, preferences, registrationExpiry } = vehicleData;

    const driver = await prisma.user.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.role !== 'DRIVER') throw new BadRequestException('User is not a driver');

    const existingVehicle = await prisma.vehicle.findUnique({ where: { licensePlate } });
    if (existingVehicle) throw new BadRequestException('Vehicle with this license plate already exists');

    const vehicle = await prisma.vehicle.create({
      data: {
        driverId,
        brand,
        model,
        licensePlate: licensePlate.toUpperCase(),
        color,
        capacity,
        preferences: preferences || { smoking: false, pets: false, music: true },
        registrationExpiry: new Date(registrationExpiry)
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    return vehicle;
  }

  async updateVehicle(vehicleId, updateData) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const data = {};
    if (updateData.brand) data.brand = updateData.brand;
    if (updateData.model) data.model = updateData.model;
    if (updateData.color) data.color = updateData.color;
    if (updateData.capacity) data.capacity = updateData.capacity;
    if (updateData.preferences) data.preferences = updateData.preferences;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;
    if (updateData.registrationExpiry) data.registrationExpiry = new Date(updateData.registrationExpiry);

    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    return updated;
  }

  async deleteVehicle(vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    await prisma.vehicle.delete({ where: { id: vehicleId } });
    return { deleted: true, vehicleId };
  }

  async updateVehicleVerification(vehicleId, status) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      throw new BadRequestException('Invalid verification status');
    }

    return prisma.vehicle.update({
      where: { id: vehicleId },
      data: { verificationStatus: status.toUpperCase() },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
  }

  async getAllRides(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { pickupLocation: { contains: filters.search, mode: 'insensitive' } },
        { dropLocation: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [rides, total] = await Promise.all([
      prisma.ridePool.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true, email: true } },
          vehicle: { select: { id: true, licensePlate: true, brand: true, model: true } },
          _count: { select: { rideRequests: true } }
        }
      }),
      prisma.ridePool.count({ where })
    ]);

    return {
      rides,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getRideDetails(rideId) {
    const ride = await prisma.ridePool.findUnique({
      where: { id: rideId },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        vehicle: true,
        rideRequests: { include: { rider: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        trips: true
      }
    });

    if (!ride) throw new NotFoundException('Ride not found');
    return ride;
  }

  async cancelRide(rideId, reason) {
    const ride = await prisma.ridePool.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException('Ride not found');

    return prisma.ridePool.update({
      where: { id: rideId },
      data: { status: 'CANCELLED' },
      include: { driver: { select: { email: true, firstName: true, lastName: true } } }
    });
  }

  async getAllTrips(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus.toUpperCase();
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ridePool: { 
            select: { 
              pickupLocation: true, 
              dropLocation: true,
              driver: { select: { id: true, firstName: true, lastName: true } } 
            } 
          }
        }
      }),
      prisma.trip.count({ where })
    ]);

    return {
      trips,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async getTripDetails(tripId) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        riders: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        ridePool: { 
          include: { 
            driver: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, 
            vehicle: true 
          } 
        }
      }
    });

    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async getAllReviews(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.rating) where.rating = parseInt(filters.rating);
    if (filters.search) {
      where.OR = [
        { comment: { contains: filters.search, mode: 'insensitive' } },
        { reviewer: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { reviewer: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { reviewee: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { reviewee: { lastName: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
          reviewee: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      }),
      prisma.review.count({ where })
    ]);

    return {
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async deleteReview(reviewId) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    await prisma.review.delete({ where: { id: reviewId } });
    return { deleted: true, reviewId };
  }

  async getSOSAlerts(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.status) where.status = filters.status.toUpperCase();

    const [alerts, total] = await Promise.all([
      prisma.sOSAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          ridePool: { select: { id: true, pickupLocation: true, dropLocation: true } }
        }
      }),
      prisma.sOSAlert.count({ where })
    ]);

    return {
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  async updateSOSAlertStatus(alertId, status) {
    const alert = await prisma.sOSAlert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('SOS Alert not found');

    return prisma.sOSAlert.update({
      where: { id: alertId },
      data: { status: status.toUpperCase() },
      select: { id: true, status: true }
    });
  }

  async getMessages(page = 1, limit = 20, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { sender: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { sender: { lastName: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, email: true } }
        }
      }),
      prisma.message.count({ where })
    ]);

    return {
      messages,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    };
  }

  parsePeriod(period) {
    const match = period.match(/^(\d+)([dwmy])$/);
    if (!match) return 30;
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { d: 1, w: 7, m: 30, y: 365 };
    return value * multipliers[unit];
  }

  aggregateByDay(data, days) {
    const result = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = data.filter(d => d.createdAt.toISOString().split('T')[0] === dateStr)
        .reduce((sum, d) => sum + d._count.id, 0);
      result.push({ date: dateStr, count });
    }
    return result;
  }
}

module.exports = new AdminService();
