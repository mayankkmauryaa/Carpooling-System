const { prisma } = require('../database/connection');

class FleetRepository {
  async findFleetByOwner(ownerId, options = {}) {
    const { include } = options;
    return await prisma.owner.findUnique({
      where: { userId: ownerId },
      include: include || {
        user: true,
        documents: true
      }
    });
  }

  async getFleetVehicles(ownerId, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId },
      include: include || {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            rating: true
          }
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            status: true,
            expiresAt: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });
    
    const total = await prisma.vehicle.count({ where: { ownerId } });
    
    return {
      items: vehicles,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async getFleetDrivers(ownerId, options = {}) {
    const { orderBy = { createdAt: 'desc' }, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    const ownerVehicles = await prisma.vehicle.findMany({
      where: { ownerId },
      select: { id: true, driverId: true }
    });
    
    const vehicleIds = ownerVehicles.map(v => v.id);
    const driverIds = [...new Set(ownerVehicles.map(v => v.driverId).filter(id => id !== null))];
    
    if (driverIds.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        pages: 0
      };
    }
    
    const totalDrivers = await prisma.user.count({
      where: { 
        id: { in: driverIds },
        role: 'DRIVER'
      }
    });

    const drivers = await prisma.user.findMany({
      where: { 
        id: { in: driverIds },
        role: 'DRIVER'
      },
      include: {
        vehicles: {
          where: { id: { in: vehicleIds } },
          select: {
            id: true,
            licensePlate: true,
            vehicleType: true,
            isActive: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });
    
    return {
      items: drivers,
      total: totalDrivers,
      page,
      limit,
      pages: Math.ceil(totalDrivers / limit)
    };
  }

  async getFleetStats(ownerId) {
    const ownerVehicles = await prisma.vehicle.findMany({
      where: { ownerId },
      select: { id: true, driverId: true }
    });
    
    const vehicleIds = ownerVehicles.map(v => v.id);
    const fleetDriverIds = [...new Set(ownerVehicles.map(v => v.driverId).filter(id => id !== null))];
    
    const [vehicleCount, activeVehicleCount, driverCount, rideCount, earnings] = await Promise.all([
      prisma.vehicle.count({ where: { ownerId } }),
      prisma.vehicle.count({ where: { ownerId, isActive: true } }),
      prisma.user.count({ where: { id: { in: fleetDriverIds }, role: 'DRIVER' } }),
      prisma.ridePool.count({ where: { vehicleId: { in: vehicleIds } } }),
      prisma.payout.aggregate({
        where: { driverId: { in: fleetDriverIds } },
        _sum: { amount: true }
      })
    ]);
    
    return {
      totalVehicles: vehicleCount,
      activeVehicles: activeVehicleCount,
      totalDrivers: driverCount,
      totalRides: rideCount,
      totalEarnings: earnings._sum.amount || 0
    };
  }

  async assignVehicleToDriver(vehicleId, driverId, ownerId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    
    if (!vehicle || vehicle.ownerId !== ownerId) {
      return null;
    }
    
    return await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { driverId }
    });
  }

  async getVehicleUtilization(ownerId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const vehicles = await prisma.vehicle.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: {
            ridePools: {
              where: { createdAt: { gte: startDate } }
            }
          }
        },
        ridePools: {
          where: { 
            createdAt: { gte: startDate },
            status: 'ACTIVE'
          },
          select: { id: true, status: true }
        }
      }
    });
    
    return vehicles.map(v => ({
      vehicleId: v.id,
      licensePlate: v.licensePlate,
      totalRides: v._count.ridePools,
      activeRides: v.ridePools.length,
      utilizationRate: days > 0 ? (v._count.ridePools / days * 100).toFixed(2) : '0.00'
    }));
  }
}

module.exports = new FleetRepository();
