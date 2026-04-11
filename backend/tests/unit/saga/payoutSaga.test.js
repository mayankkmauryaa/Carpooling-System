const { mockTrip, mockDriver } = require('../../fixtures/mockData');

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const mockPrisma = {
  trip: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  payout: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  wallet: {
    upsert: jest.fn(),
    update: jest.fn(),
  },
  walletTransaction: {
    create: jest.fn(),
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
  createCustomer: jest.fn(),
  createPayout: jest.fn(),
}));

const paymentService = require('../../../src/services/paymentService');

describe('PayoutSaga', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Validate Trip', () => {
    it('should validate completed trip successfully', async () => {
      const mockTripData = {
        ...mockTrip,
        id: 1,
        status: 'COMPLETED',
        totalFare: 100,
        ridePool: { id: 1 },
        driver: { id: 2, firstName: 'Driver', lastName: 'Name' },
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTripData);
      mockPrisma.payout.findFirst.mockResolvedValue(null);

      const { validateTripStep } = require('../../../src/saga/payoutSaga');
      const result = await validateTripStep({ tripId: 1 });

      expect(result.success).toBe(true);
      expect(result.totalFare).toBe(100);
      expect(result.driverEarnings).toBe(80);
    });

    it('should fail if trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      const { validateTripStep } = require('../../../src/saga/payoutSaga');
      const result = await validateTripStep({ tripId: 999 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Trip not found');
    });

    it('should fail if trip not completed', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'IN_PROGRESS',
      });

      const { validateTripStep } = require('../../../src/saga/payoutSaga');
      const result = await validateTripStep({ tripId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Trip not completed');
    });

    it('should fail if payout already processed', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue({
        ...mockTrip,
        status: 'COMPLETED',
      });
      mockPrisma.payout.findFirst.mockResolvedValue({ id: 1 });

      const { validateTripStep } = require('../../../src/saga/payoutSaga');
      const result = await validateTripStep({ tripId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payout already processed');
    });
  });

  describe('Step 2: Calculate Payout', () => {
    it('should calculate payout with correct split', async () => {
      const { calculatePayoutStep } = require('../../../src/saga/payoutSaga');
      const result = await calculatePayoutStep({
        validateTrip: { totalFare: 100 },
      });

      expect(result.success).toBe(true);
      expect(result.platformFee).toBe(20);
      expect(result.driverEarnings).toBe(80);
      expect(result.totalFare).toBe(100);
    });

    it('should handle zero fare', async () => {
      const { calculatePayoutStep } = require('../../../src/saga/payoutSaga');
      const result = await calculatePayoutStep({
        validateTrip: { totalFare: 0 },
      });

      expect(result.success).toBe(true);
      expect(result.platformFee).toBe(0);
      expect(result.driverEarnings).toBe(0);
    });
  });

  describe('Step 3: Process Payout', () => {
    it('should return error when driver not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { processPayoutStep } = require('../../../src/saga/payoutSaga');
      const result = await processPayoutStep({
        validateTrip: { driverId: 2, tripId: 1 },
        calculatePayout: { driverEarnings: 80, platformFee: 20, totalFare: 100 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Driver not found');
    });

    it('should create Razorpay account if not exists', async () => {
      const mockDriverData = {
        id: 2,
        email: 'driver@example.com',
        firstName: 'Driver',
        lastName: 'Name',
        razorpayAccountId: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockDriverData);
      paymentService.createCustomer.mockResolvedValue({ customerId: 'cust_123' });

      const { processPayoutStep } = require('../../../src/saga/payoutSaga');
      const result = await processPayoutStep({
        validateTrip: { driverId: 2, tripId: 1 },
        calculatePayout: { driverEarnings: 80, platformFee: 20, totalFare: 100 },
      });

      expect(paymentService.createCustomer).toHaveBeenCalled();
    });

    it('should fail if driver not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const { processPayoutStep } = require('../../../src/saga/payoutSaga');
      const result = await processPayoutStep({
        validateTrip: { driverId: 999, tripId: 1 },
        calculatePayout: { driverEarnings: 80 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Driver not found');
    });
  });

  describe('Step 4: Update Driver Earnings', () => {
    it('should update wallet balance successfully', async () => {
      const mockWallet = {
        id: 1,
        balance: 100,
      };

      mockPrisma.wallet.upsert.mockResolvedValue(mockWallet);
      mockPrisma.wallet.update.mockResolvedValue({ ...mockWallet, balance: 180 });
      mockPrisma.walletTransaction.create.mockResolvedValue({ id: 1 });

      const { updateDriverEarningsStep } = require('../../../src/saga/payoutSaga');
      const result = await updateDriverEarningsStep({
        validateTrip: { driverId: 2, tripId: 1 },
        calculatePayout: { driverEarnings: 80 },
        processPayout: { payoutId: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(180);
    });
  });

  describe('Step 5: Notify Driver', () => {
    it('should notify driver successfully', async () => {
      const { notifyDriverStep } = require('../../../src/saga/payoutSaga');
      const result = await notifyDriverStep({
        validateTrip: { driverId: 2 },
      });

      expect(result.success).toBe(true);
      expect(result.notified).toBe(true);
    });
  });

  describe('Compensation Steps', () => {
    it('should cancel payout on compensation', async () => {
      mockPrisma.payout.update.mockResolvedValue({
        id: 1,
        status: 'CANCELLED',
      });

      const { cancelPayoutCompensation } = require('../../../src/saga/payoutSaga');
      const result = await cancelPayoutCompensation({
        processPayout: { payoutId: 1 },
      });

      expect(result.success).toBe(true);
    });

    it('should reverse earnings on compensation', async () => {
      mockPrisma.wallet.update.mockResolvedValue({ balance: 100 });
      mockPrisma.walletTransaction.create.mockResolvedValue({ id: 1 });

      const { reverseEarningsCompensation } = require('../../../src/saga/payoutSaga');
      const result = await reverseEarningsCompensation({
        validateTrip: { driverId: 2 },
        calculatePayout: { driverEarnings: 80 },
        updateDriverEarnings: { newBalance: 180 },
        processPayout: { payoutId: 1 },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('executePayoutSaga', () => {
    it('should execute full saga successfully', async () => {
      const mockTripData = {
        ...mockTrip,
        id: 1,
        status: 'COMPLETED',
        totalFare: 100,
        ridePool: { id: 1 },
        driver: { id: 2, email: 'driver@example.com', firstName: 'Driver', lastName: 'Name', razorpayAccountId: 'acc_123' },
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTripData);
      mockPrisma.payout.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockTripData.driver);
      paymentService.createPayout.mockResolvedValue({ payoutId: 'payout_123', status: 'PROCESSING' });
      mockPrisma.payout.create.mockResolvedValue({ id: 1 });
      mockPrisma.wallet.upsert.mockResolvedValue({ id: 1, balance: 100 });
      mockPrisma.wallet.update.mockResolvedValue({ id: 1, balance: 180 });
      mockPrisma.walletTransaction.create.mockResolvedValue({ id: 1 });

      const { executePayoutSaga } = require('../../../src/saga/payoutSaga');
      const result = await executePayoutSaga({ tripId: 1 });

      expect(result.success).toBe(true);
    });
  });
});
