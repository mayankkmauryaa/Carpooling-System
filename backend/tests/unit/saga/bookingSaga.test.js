const { mockRidePool, mockBooking } = require('../../fixtures/mockData');

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const mockPrisma = {
  ridePool: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  rideRequest: {
    create: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    create: jest.fn(),
    update: jest.fn(),
  },
  sagaLog: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
    update: jest.fn().mockResolvedValue({ id: 1 }),
  },
  sagaStepLog: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
};

jest.mock('../../../src/database/connection', () => ({
  prisma: mockPrisma
}));

jest.mock('../../../src/services/paymentService', () => ({
  createOrder: jest.fn(),
  cancelOrder: jest.fn(),
}));

jest.mock('../../../src/services/rideService', () => ({}));

const paymentService = require('../../../src/services/paymentService');

describe('BookingSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Reserve Seat', () => {
    it('should reserve seat successfully', async () => {
      const mockRide = {
        ...mockRidePool,
        availableSeats: 3,
      };

      const mockRideRequest = {
        id: 1,
        ridePoolId: 1,
        riderId: 1,
        status: 'PENDING',
      };

      mockPrisma.ridePool.findUnique.mockResolvedValue(mockRide);
      mockPrisma.ridePool.update.mockResolvedValue({
        ...mockRide,
        availableSeats: 2,
      });
      mockPrisma.rideRequest.create.mockResolvedValue(mockRideRequest);

      const { reserveSeatStep } = require('../../../src/saga/bookingSaga');
      const result = await reserveSeatStep({
        ridePoolId: 1,
        riderId: 1,
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
      });

      expect(result.success).toBe(true);
      expect(result.rideRequestId).toBe(1);
      expect(mockPrisma.rideRequest.create).toHaveBeenCalled();
    });

    it('should fail if ride not found', async () => {
      mockPrisma.ridePool.findUnique.mockResolvedValue(null);

      const { reserveSeatStep } = require('../../../src/saga/bookingSaga');
      const result = await reserveSeatStep({
        ridePoolId: 999,
        riderId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ride not found');
    });

    it('should fail if no seats available', async () => {
      mockPrisma.ridePool.findUnique.mockResolvedValue({
        ...mockRidePool,
        availableSeats: 0,
      });

      const { reserveSeatStep } = require('../../../src/saga/bookingSaga');
      const result = await reserveSeatStep({
        ridePoolId: 1,
        riderId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No seats available');
    });
  });

  describe('Step 2: Process Payment', () => {
    it('should create payment order successfully', async () => {
      const mockOrder = {
        orderId: 'order_123',
        amount: 1500,
        currency: 'INR',
      };

      paymentService.createOrder.mockResolvedValue(mockOrder);

      const { processPaymentStep } = require('../../../src/saga/bookingSaga');
      const result = await processPaymentStep({
        riderId: 1,
        ridePoolId: 1,
        amount: 15.00,
        reserveSeat: { rideRequestId: 1 },
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order_123');
    });

    it('should fail if payment creation fails', async () => {
      paymentService.createOrder.mockRejectedValue(new Error('Payment failed'));

      const { processPaymentStep } = require('../../../src/saga/bookingSaga');
      const result = await processPaymentStep({
        riderId: 1,
        amount: 15.00,
        reserveSeat: { rideRequestId: 1 },
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment failed');
    });
  });

  describe('Step 3: Approve Request', () => {
    it('should approve request successfully', async () => {
      mockPrisma.rideRequest.update.mockResolvedValue({
        id: 1,
        status: 'APPROVED',
        approvedAt: expect.any(Date),
      });

      const { approveRequestStep } = require('../../../src/saga/bookingSaga');
      const result = await approveRequestStep({
        reserveSeat: { rideRequestId: 1 },
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.rideRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({
          status: 'APPROVED',
          approvedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('Step 4: Create Booking', () => {
    it('should create booking successfully', async () => {
      const mockCreatedBooking = {
        id: 1,
        ridePoolId: 1,
        riderId: 1,
        status: 'CONFIRMED',
        totalAmount: 15.00,
      };

      mockPrisma.booking.create.mockResolvedValue(mockCreatedBooking);

      const { createBookingStep } = require('../../../src/saga/bookingSaga');
      const result = await createBookingStep({
        ridePoolId: 1,
        riderId: 1,
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
        amount: 15.00,
        processPayment: { orderId: 'order_123' },
        reserveSeat: { rideRequestId: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe(1);
    });
  });

  describe('Compensation Steps', () => {
    it('should release seat on compensation', async () => {
      const mockRide = {
        ...mockRidePool,
        availableSeats: 2,
        bookedSeats: 1,
      };

      mockPrisma.ridePool.findUnique.mockResolvedValue(mockRide);
      mockPrisma.ridePool.update.mockResolvedValue({
        ...mockRide,
        availableSeats: 3,
        bookedSeats: 0,
      });

      const { releaseSeatCompensation } = require('../../../src/saga/bookingSaga');
      const result = await releaseSeatCompensation({
        ridePoolId: 1,
        reserveSeat: { rideRequestId: 1 },
      });

      expect(result.success).toBe(true);
    });

    it('should cancel payment on compensation', async () => {
      paymentService.cancelOrder.mockResolvedValue(true);

      const { cancelPaymentCompensation } = require('../../../src/saga/bookingSaga');
      const result = await cancelPaymentCompensation({
        processPayment: { orderId: 'order_123' },
      });

      expect(result.success).toBe(true);
      expect(paymentService.cancelOrder).toHaveBeenCalledWith('order_123');
    });

    it('should reject request on compensation', async () => {
      mockPrisma.rideRequest.update.mockResolvedValue({
        id: 1,
        status: 'REJECTED',
      });

      const { rejectRequestCompensation } = require('../../../src/saga/bookingSaga');
      const result = await rejectRequestCompensation({
        reserveSeat: { rideRequestId: 1 },
      });

      expect(result.success).toBe(true);
    });

    it('should cancel booking on compensation', async () => {
      mockPrisma.booking.update.mockResolvedValue({
        id: 1,
        status: 'CANCELLED',
      });

      const { cancelBookingCompensation } = require('../../../src/saga/bookingSaga');
      const result = await cancelBookingCompensation({
        createBooking: { bookingId: 1 },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('executeBookingSaga', () => {
    it('should execute full saga successfully', async () => {
      const mockRide = { ...mockRidePool, availableSeats: 3 };
      const mockRideRequest = { id: 1, status: 'PENDING' };
      const mockOrder = { orderId: 'order_123', amount: 1500 };
      const mockBooking = { id: 1, status: 'CONFIRMED' };

      mockPrisma.ridePool.findUnique.mockResolvedValue(mockRide);
      mockPrisma.ridePool.update.mockResolvedValue({ ...mockRide, availableSeats: 2 });
      mockPrisma.rideRequest.create.mockResolvedValue(mockRideRequest);
      mockPrisma.rideRequest.update.mockResolvedValue({ ...mockRideRequest, status: 'APPROVED' });
      paymentService.createOrder.mockResolvedValue(mockOrder);
      mockPrisma.booking.create.mockResolvedValue(mockBooking);

      const { executeBookingSaga } = require('../../../src/saga/bookingSaga');
      const result = await executeBookingSaga({
        ridePoolId: 1,
        riderId: 1,
        amount: 15.00,
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
      });

      expect(result.success).toBe(true);
    });

    it('should rollback on failure', async () => {
      mockPrisma.ridePool.findUnique.mockResolvedValue({ ...mockRidePool, availableSeats: 3 });
      mockPrisma.ridePool.update.mockResolvedValue({ ...mockRidePool, availableSeats: 3 });
      mockPrisma.rideRequest.create.mockResolvedValue({ id: 1 });
      paymentService.createOrder.mockRejectedValue(new Error('Payment failed'));
      paymentService.cancelOrder.mockResolvedValue(true);
      mockPrisma.rideRequest.update.mockResolvedValue({ id: 1, status: 'CANCELLED' });

      const { executeBookingSaga } = require('../../../src/saga/bookingSaga');
      const result = await executeBookingSaga({
        ridePoolId: 1,
        riderId: 1,
        amount: 15.00,
        pickupLocation: { address: 'Pickup' },
        dropLocation: { address: 'Drop' },
      });

      expect(result.success).toBe(false);
    });
  });
});
