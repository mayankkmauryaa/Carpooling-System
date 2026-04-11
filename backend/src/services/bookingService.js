const { prisma } = require('../database/connection');
const logger = require('../middleware/logger');

class BookingService {
  async createBooking(riderId, bookingData) {
    const { ridePoolId, pickupLocation, dropLocation, startDate, endDate } = bookingData;

    const ridePool = await prisma.ridePool.findUnique({
      where: { id: ridePoolId },
      include: { vehicle: true, driver: true }
    });

    if (!ridePool) {
      throw new Error('Ride pool not found');
    }

    if (ridePool.status !== 'ACTIVE') {
      throw new Error('Ride pool is not active');
    }

    const seatsToBook = bookingData.seatsBooked || 1;

    if (ridePool.availableSeats < seatsToBook) {
      throw new Error(`Only ${ridePool.availableSeats} seats available`);
    }

    const conflictExists = await this.findConflictingBookings(
      ridePool.vehicleId,
      startDate,
      endDate
    );

    if (conflictExists.length > 0) {
      throw new Error('Vehicle has conflicting bookings for the selected dates');
    }

    const totalAmount = ridePool.pricePerSeat * seatsToBook;

    const booking = await prisma.booking.create({
      data: {
        ridePoolId,
        riderId,
        status: 'PENDING',
        pickupLocation,
        dropLocation,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalAmount,
        seatsBooked: seatsToBook
      },
      include: {
        ridePool: {
          include: {
            vehicle: true,
            driver: { select: { firstName: true, lastName: true, phone: true } }
          }
        },
        rider: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    logger.info('Booking created', { bookingId: booking.id, riderId, ridePoolId });

    return booking;
  }

  async getBookingById(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ridePool: {
          include: {
            vehicle: true,
            driver: { select: { firstName: true, lastName: true, phone: true, profilePicture: true } }
          }
        },
        rider: { select: { firstName: true, lastName: true, email: true, phone: true } }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return booking;
  }

  async getBookingsByUser(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where = { riderId: userId };
    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          ridePool: {
            include: {
              vehicle: { select: { brand: true, model: true, color: true, licensePlate: true } },
              driver: { select: { firstName: true, lastName: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    return {
      items: bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  }

  async getAllBookings(options = {}) {
    const { status, page = 1, limit = 20, userId, ridePoolId } = options;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (userId) where.riderId = parseInt(userId);
    if (ridePoolId) where.ridePoolId = parseInt(ridePoolId);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          ridePool: {
            include: {
              vehicle: { select: { brand: true, model: true, licensePlate: true } },
              driver: { select: { firstName: true, lastName: true } }
            }
          },
          rider: { select: { firstName: true, lastName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    return {
      items: bookings,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    };
  }

  async approveBooking(bookingId, adminId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'PENDING') {
      throw new Error('Booking is not in pending status');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'APPROVED',
        confirmedAt: new Date()
      },
      include: {
        rider: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    logger.info('Booking approved by admin', { bookingId, adminId });

    return updated;
  }

  async rejectBooking(bookingId, adminId, reason) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    logger.info('Booking rejected', { bookingId, adminId, reason });

    return updated;
  }

  async cancelBooking(bookingId, userId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.riderId !== userId) {
      throw new Error('Not authorized to cancel this booking');
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new Error('Booking cannot be cancelled');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    logger.info('Booking cancelled', { bookingId, userId });

    return updated;
  }

  async updateBookingStatus(bookingId, status) {
    const validStatuses = ['PENDING', 'APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid booking status');
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        confirmedAt: ['APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED'].includes(status) ? new Date() : undefined,
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined
      }
    });

    logger.info('Booking status updated', { bookingId, status });

    return updated;
  }

  async findConflictingBookings(vehicleId, startDate, endDate, excludeBookingId = null) {
    const where = {
      ridePool: { vehicleId },
      status: { in: ['PENDING', 'APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED'] }
    };

    if (startDate && endDate) {
      where.AND = [
        {
          OR: [
            {
              AND: [
                { startDate: { lte: new Date(endDate) } },
                { endDate: { gte: new Date(startDate) } }
              ]
            },
            { startDate: null, endDate: null }
          ]
        }
      ];
    }

    if (excludeBookingId) {
      where.NOT = { id: excludeBookingId };
    }

    return await prisma.booking.findMany({
      where,
      include: {
        ridePool: true,
        rider: { select: { firstName: true, lastName: true } }
      }
    });
  }

  async getBookingStats() {
    const [total, pending, approved, completed, cancelled] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: { in: ['APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED'] } } }),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } })
    ]);

    const revenue = await prisma.booking.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { totalAmount: true }
    });

    return {
      total,
      pending,
      approved,
      completed,
      cancelled,
      totalRevenue: revenue._sum.totalAmount || 0
    };
  }
}

module.exports = new BookingService();
