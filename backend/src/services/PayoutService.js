const BaseService = require('./base/BaseService');
const { prisma } = require('../database/connection');
const { NotFoundException } = require('../exceptions');

class PayoutService extends BaseService {
  constructor() {
    super(prisma.payout);
  }

  async getDriverEarnings(driverId, options = {}) {
    const { page = 1, limit = 10, startDate, endDate, status } = options;

    const where = { driverId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          trip: {
            include: {
              ridePool: {
                select: { pickupLocation: true, dropLocation: true, departureTime: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payout.count({ where })
    ]);

    const totalEarnings = payouts.reduce((sum, p) => sum + (p.amount - p.platformFee), 0);
    const totalPlatformFee = payouts.reduce((sum, p) => sum + p.platformFee, 0);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalPlatformFee: Math.round(totalPlatformFee * 100) / 100,
        netEarnings: Math.round((totalEarnings - totalPlatformFee) * 100) / 100,
        completedPayouts: payouts.filter(p => p.status === 'COMPLETED').length,
        pendingPayouts: payouts.filter(p => p.status === 'PENDING').length,
        failedPayouts: payouts.filter(p => p.status === 'FAILED').length
      }
    };
  }

  async getOwnerPayouts(ownerId, options = {}) {
    const { page = 1, limit = 10, startDate, endDate, status } = options;

    const where = {
      trip: {
        ridePool: {
          vehicle: {
            ownerId
          }
        }
      }
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          driver: {
            select: { id: true, firstName: true, lastName: true }
          },
          trip: {
            include: {
              ridePool: {
                select: { id: true, pickupLocation: true, dropLocation: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.payout.count({ where })
    ]);

    const totalEarnings = payouts.reduce((sum, p) => sum + p.amount, 0);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalPayouts: Math.round(totalEarnings * 100) / 100,
        completedPayouts: payouts.filter(p => p.status === 'COMPLETED').length,
        pendingPayouts: payouts.filter(p => p.status === 'PENDING').length,
        failedPayouts: payouts.filter(p => p.status === 'FAILED').length
      }
    };
  }

  async getEarningsSummary(driverId, period = 'month') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const payouts = await prisma.payout.findMany({
      where: {
        driverId,
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      }
    });

    const totalEarnings = payouts.reduce((sum, p) => sum + (p.amount - p.platformFee), 0);
    const totalTrips = payouts.length;

    return {
      period,
      startDate,
      endDate: now,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalTrips,
      averagePerTrip: totalTrips > 0 ? Math.round((totalEarnings / totalTrips) * 100) / 100 : 0
    };
  }
}

module.exports = new PayoutService();