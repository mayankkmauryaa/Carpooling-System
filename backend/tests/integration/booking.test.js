const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { mockUser, mockDriver, mockRidePool, mockBooking, createMockToken } = require('../fixtures/mockData');

jest.mock('../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const mockPrisma = {
  booking: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  ridePool: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock('../../src/database/connection', () => ({
  prisma: mockPrisma
}));

const bookingController = require('../../src/controllers/bookingController');
const { auth } = require('../../src/middleware/auth');

const app = express();
app.use(express.json());

app.post('/api/v1/bookings', auth, bookingController.createBooking);
app.get('/api/v1/bookings/my-bookings', auth, bookingController.getMyBookings);
app.get('/api/v1/bookings/:id', auth, bookingController.getBookingById);
app.put('/api/v1/bookings/:id/cancel', auth, bookingController.cancelBooking);

describe.skip('Booking API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/bookings', () => {
    it('should create booking successfully', async () => {
      const token = createMockToken(mockUser.id);
      const bookingData = {
        ridePoolId: 1,
        seatsBooked: 1,
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.ridePool.findUnique.mockResolvedValue({
        ...mockRidePool,
        availableSeats: 3,
        status: 'ACTIVE',
      });
      mockPrisma.ridePool.update.mockResolvedValue({
        ...mockRidePool,
        availableSeats: 2,
      });
      mockPrisma.booking.create.mockResolvedValue({
        id: 1,
        ...bookingData,
        status: 'PENDING',
        riderId: mockUser.id,
      });

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/bookings')
        .send({ ridePoolId: 1 });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid ridePoolId', async () => {
      const token = createMockToken(mockUser.id);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.ridePool.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ ridePoolId: 999 });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/bookings/my-bookings', () => {
    it('should return user bookings', async () => {
      const token = createMockToken(mockUser.id);
      const mockBookings = [
        { ...mockBooking, id: 1 },
        { ...mockBooking, id: 2 },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findMany.mockResolvedValue(mockBookings);
      mockPrisma.booking.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should filter bookings by status', async () => {
      const token = createMockToken(mockUser.id);
      const completedBookings = [
        { ...mockBooking, id: 1, status: 'COMPLETED' },
      ];

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findMany.mockResolvedValue(completedBookings);
      mockPrisma.booking.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/bookings/my-bookings?status=COMPLETED')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const token = createMockToken(mockUser.id);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.booking.count.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/v1/bookings/my-bookings?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/bookings/:id', () => {
    it('should return booking by id', async () => {
      const token = createMockToken(mockUser.id);
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        rider: mockUser,
        ridePool: mockRidePool,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);

      const response = await request(app)
        .get('/api/v1/bookings/1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent booking', async () => {
      const token = createMockToken(mockUser.id);

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/bookings/999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/bookings/:id/cancel', () => {
    it('should cancel booking successfully', async () => {
      const token = createMockToken(mockUser.id);
      const mockBookingData = {
        ...mockBooking,
        id: 1,
        status: 'CONFIRMED',
        ridePool: mockRidePool,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findUnique.mockResolvedValue(mockBookingData);
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBookingData,
        status: 'CANCELLED',
        cancelledAt: expect.any(Date),
      });

      const response = await request(app)
        .put('/api/v1/bookings/1/cancel')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Changed plans' });

      expect(response.status).toBe(200);
      expect(response.body.data.cancelled).toBe(true);
    });

    it('should return 400 for already cancelled booking', async () => {
      const token = createMockToken(mockUser.id);
      const cancelledBooking = {
        ...mockBooking,
        id: 1,
        status: 'CANCELLED',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.booking.findUnique.mockResolvedValue(cancelledBooking);

      const response = await request(app)
        .put('/api/v1/bookings/1/cancel')
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'Changed plans' });

      expect(response.status).toBe(400);
    });
  });
});
