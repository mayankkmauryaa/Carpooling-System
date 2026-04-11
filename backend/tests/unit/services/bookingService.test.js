const { mockUser, mockDriver, mockRidePool, mockBooking, createMockUser } = require('../../fixtures/mockData');

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../src/services/base/BaseService');

const mockPrisma = {
  booking: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  ridePool: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  rideRequest: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../../src/database/connection', () => ({
  prisma: mockPrisma
}));

const bookingService = require('../../../src/services/bookingService');

describe('BookingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bookingService.findConflictingBookings = jest.fn().mockResolvedValue([]);
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const bookingData = {
        ridePoolId: 1,
        riderId: 1,
        seatsBooked: 1,
        pickupLocation: { address: 'Pickup Address' },
        dropLocation: { address: 'Drop Address' },
      };

      const mockRidePoolData = {
        ...mockRidePool,
        id: 1,
        availableSeats: 3,
        status: 'ACTIVE',
        pricePerSeat: 15,
        vehicle: { id: 1 },
        driver: { firstName: 'Test', lastName: 'Driver' },
      };

      const mockCreatedBooking = {
        id: 1,
        ...bookingData,
        status: 'PENDING',
        totalAmount: 15.00,
        ridePool: mockRidePoolData,
        rider: { firstName: 'Test', lastName: 'Rider', email: 'test@example.com' },
      };

      mockPrisma.ridePool.findUnique.mockResolvedValue(mockRidePoolData);
      mockPrisma.booking.create.mockResolvedValue(mockCreatedBooking);

      const result = await bookingService.createBooking(1, bookingData);

      expect(mockPrisma.booking.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw error if ride pool not found', async () => {
      mockPrisma.ridePool.findUnique.mockResolvedValue(null);

      await expect(bookingService.createBooking(1, { ridePoolId: 999 }))
        .rejects.toThrow();
    });

    it('should throw error if ride pool is not active', async () => {
      mockPrisma.ridePool.findUnique.mockResolvedValue({
        ...mockRidePool,
        status: 'CANCELLED'
      });

      await expect(bookingService.createBooking(1, { ridePoolId: 1 }))
        .rejects.toThrow();
    });

    it('should throw error if no seats available', async () => {
      mockPrisma.ridePool.findUnique.mockResolvedValue({
        ...mockRidePool,
        availableSeats: 0,
        status: 'ACTIVE'
      });

      await expect(bookingService.createBooking(1, { ridePoolId: 1 }))
        .rejects.toThrow();
    });
  });

  describe('getBookingById', () => {
    it('should return booking by id', async () => {
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        ridePool: mockRidePool,
        rider: mockUser,
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);

      const result = await bookingService.getBookingById(1);

      expect(result).toHaveProperty('id', 1);
      expect(mockPrisma.booking.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object)
      });
    });

    it('should throw error if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(bookingService.getBookingById(999)).rejects.toThrow();
    });
  });

  describe('getBookingsByUser', () => {
    it('should return paginated bookings for user', async () => {
      const mockBookings = [
        { ...mockBooking, id: 1 },
        { ...mockBooking, id: 2 },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
      mockPrisma.booking.count.mockResolvedValue(2);

      const result = await bookingService.getBookingsByUser(1, { page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total', 2);
      expect(result.items).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const mockBookings = [{ ...mockBooking, status: 'COMPLETED' }];

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
      mockPrisma.booking.count.mockResolvedValue(1);

      const result = await bookingService.getBookingsByUser(1, { status: 'COMPLETED' });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            riderId: 1,
            status: 'COMPLETED'
          })
        })
      );
    });
  });

  describe('approveBooking', () => {
    it('should approve a pending booking', async () => {
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        status: 'PENDING',
        ridePool: mockRidePool,
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBookingData,
        status: 'APPROVED'
      });

      const result = await bookingService.approveBooking(1, 2);

      expect(result.status).toBe('APPROVED');
      expect(mockPrisma.booking.update).toHaveBeenCalled();
    });

    it('should throw error if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(bookingService.approveBooking(999, 2)).rejects.toThrow();
    });
  });

  describe('rejectBooking', () => {
    it('should reject a booking with reason', async () => {
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        status: 'PENDING',
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBookingData,
        status: 'CANCELLED'
      });

      const result = await bookingService.rejectBooking(1, 2, 'Not available');

      expect(result.status).toBe('CANCELLED');
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', async () => {
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        riderId: 1,
        status: 'CONFIRMED',
        ridePool: mockRidePool,
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBookingData,
        status: 'CANCELLED',
        cancelledAt: expect.any(Date)
      });

      const result = await bookingService.cancelBooking(1, 1);

      expect(result.status).toBe('CANCELLED');
    });

    it('should throw error if booking already cancelled', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'CANCELLED'
      });

      await expect(bookingService.cancelBooking(1, 1))
        .rejects.toThrow();
    });
  });

  describe('updateBookingStatus', () => {
    it('should update booking status', async () => {
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        status: 'PENDING',
      };

      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBookingData,
        status: 'PAID'
      });

      const result = await bookingService.updateBookingStatus(1, 'PAID');

      expect(result.status).toBe('PAID');
    });
  });

  describe('getBookingStats', () => {
    it('should return booking statistics', async () => {
      mockPrisma.booking.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20);
      mockPrisma.booking.aggregate.mockResolvedValue({
        _sum: { totalAmount: 5000 }
      });

      const result = await bookingService.getBookingStats();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('totalRevenue', 5000);
    });
  });

  describe('getAllBookings', () => {
    it('should return paginated list of all bookings', async () => {
      const mockBookings = [
        { ...mockBooking, id: 1 },
        { ...mockBooking, id: 2 },
      ];

      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
      mockPrisma.booking.count.mockResolvedValue(50);

      const result = await bookingService.getAllBookings({ page: 1, limit: 10 });

      expect(result).toHaveProperty('items');
      expect(result.items).toHaveLength(2);
    });

    it('should filter by userId', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.booking.count.mockResolvedValue(0);

      await bookingService.getAllBookings({ userId: 1 });

      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            riderId: 1
          })
        })
      );
    });
  });
});
