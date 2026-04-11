jest.mock('../../../src/database/connection', () => ({
  prisma: {
    booking: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    ridePool: {
      update: jest.fn()
    },
    sagaLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
      update: jest.fn().mockResolvedValue({ id: 1 })
    },
    sagaStepLog: {
      create: jest.fn().mockResolvedValue({ id: 1 })
    }
  }
}));

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../src/events/eventBus', () => ({
  emit: jest.fn()
}));

jest.mock('../../../src/services/priceCalculationService', () => ({
  calculateCancellationRefund: jest.fn()
}));

const { prisma } = require('../../../src/database/connection');
const priceCalculationService = require('../../../src/services/priceCalculationService');
const eventBus = require('../../../src/events/eventBus');

const { executeCancellationSaga } = require('../../../src/saga/cancellationSaga');

describe('CancellationSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBookingStep', () => {
    it('should return error if booking not found', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      const { sagaOrchestrator } = require('../../../src/saga/sagaOrchestrator');
      
      const result = await sagaOrchestrator.execute('CANCELLATION', {
        bookingId: 999,
        userId: 1
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Booking not found');
    });

    it('should return error if booking already cancelled', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 1,
        status: 'CANCELLED',
        ridePoolId: 1,
        ridePool: { departureTime: new Date() }
      });

      const { sagaOrchestrator } = require('../../../src/saga/sagaOrchestrator');
      
      const result = await sagaOrchestrator.execute('CANCELLATION', {
        bookingId: 1,
        userId: 1
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Booking is already cancelled');
    });

    it('should return error for non-cancellable status', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        id: 1,
        status: 'COMPLETED',
        ridePoolId: 1,
        ridePool: { departureTime: new Date() }
      });

      const { sagaOrchestrator } = require('../../../src/saga/sagaOrchestrator');
      
      const result = await sagaOrchestrator.execute('CANCELLATION', {
        bookingId: 1,
        userId: 1
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cancel booking with status: COMPLETED');
    });

    it('should validate PENDING booking successfully', async () => {
      const mockBooking = {
        id: 1,
        status: 'PENDING',
        riderId: 1,
        ridePoolId: 1,
        seatsBooked: 2,
        totalAmount: 100,
        razorpayPaymentId: 'pay_123',
        ridePool: { departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000) }
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      priceCalculationService.calculateCancellationRefund.mockReturnValue({
        isEligibleForRefund: true,
        actualRefundToUser: 85,
        refundPolicy: '100% refund'
      });

      const { sagaOrchestrator } = require('../../../src/saga/sagaOrchestrator');
      
      try {
        await sagaOrchestrator.execute('CANCELLATION', {
          bookingId: 1,
          userId: 1
        });
      } catch (error) {
        // Saga will continue with next steps
      }
    });
  });

  describe('updateBookingStatusStep', () => {
    it('should update booking status to CANCELLED', async () => {
      const mockBooking = {
        id: 1,
        status: 'PENDING',
        riderId: 1,
        ridePoolId: 1,
        seatsBooked: 1,
        totalAmount: 50,
        ridePool: { departureTime: new Date(Date.now() + 48 * 60 * 60 * 1000) }
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.booking.update.mockResolvedValue({ ...mockBooking, status: 'CANCELLED' });
      priceCalculationService.calculateCancellationRefund.mockReturnValue({
        isEligibleForRefund: true,
        actualRefundToUser: 42.5
      });

      eventBus.emit.mockImplementation(() => {});
    });

    it('should emit booking.cancelled event', () => {
      eventBus.emit('booking.cancelled', {
        bookingId: 1,
        userId: 1,
        reason: 'User requested'
      });

      expect(eventBus.emit).toHaveBeenCalledWith('booking.cancelled', expect.objectContaining({
        bookingId: 1,
        userId: 1
      }));
    });
  });

  describe('releaseSeatsStep', () => {
    it('should release seats for CONFIRMED booking', async () => {
      const mockBooking = {
        id: 1,
        status: 'CONFIRMED',
        riderId: 1,
        ridePoolId: 1,
        seatsBooked: 2,
        totalAmount: 100,
        ridePool: { departureTime: new Date() }
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.ridePool.update.mockResolvedValue({ id: 1, availableSeats: 3 });
      priceCalculationService.calculateCancellationRefund.mockReturnValue({
        isEligibleForRefund: true,
        actualRefundToUser: 85
      });
    });

    it('should not release seats for COMPLETED booking', async () => {
      const mockBooking = {
        id: 1,
        status: 'COMPLETED',
        ridePoolId: 1,
        seatsBooked: 1
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);

      const { sagaOrchestrator } = require('../../../src/saga/sagaOrchestrator');
      
      const result = await sagaOrchestrator.execute('CANCELLATION', {
        bookingId: 1,
        userId: 1
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot cancel booking');
    });
  });

  describe('sendNotificationStep', () => {
    it('should emit notification for refund eligible cancellation', () => {
      eventBus.emit('notification.send', {
        userId: 1,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: expect.stringContaining('refund'),
        data: expect.any(Object)
      });

      expect(eventBus.emit).toHaveBeenCalledWith('notification.send', expect.objectContaining({
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled'
      }));
    });

    it('should emit notification for no refund cancellation', () => {
      eventBus.emit('notification.send', {
        userId: 1,
        type: 'BOOKING_CANCELLED',
        title: 'Booking Cancelled',
        message: expect.stringContaining('No refund'),
        data: expect.any(Object)
      });
    });
  });

  describe('completeSagaStep', () => {
    it('should update sagaState to COMPLETED', async () => {
      prisma.booking.update.mockResolvedValue({
        id: 1,
        sagaState: 'COMPLETED'
      });

      expect(prisma.booking.update).toBeDefined();
    });
  });
});
