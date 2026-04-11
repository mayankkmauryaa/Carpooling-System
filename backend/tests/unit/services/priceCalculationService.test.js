jest.mock('../../../src/database/connection', () => ({
  prisma: {
    vehicle: {
      findUnique: jest.fn()
    },
    ridePool: {
      findUnique: jest.fn()
    },
    booking: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const { prisma } = require('../../../src/database/connection');
const priceCalculationService = require('../../../src/services/priceCalculationService');

describe('PriceCalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateDays', () => {
    it('should calculate days between two dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-05');

      const days = priceCalculationService.calculateDays(startDate, endDate);

      expect(days).toBe(4);
    });

    it('should return 1 for same day rental', () => {
      const date = new Date('2024-01-01');

      const days = priceCalculationService.calculateDays(date, date);

      expect(days).toBe(1);
    });

    it('should handle overnight rentals', () => {
      const startDate = new Date('2024-01-01T18:00:00');
      const endDate = new Date('2024-01-02T09:00:00');

      const days = priceCalculationService.calculateDays(startDate, endDate);

      expect(days).toBe(1);
    });
  });

  describe('calculateRentalPrice', () => {
    it('should calculate total rental price with fees and taxes', async () => {
      const mockVehicle = {
        id: 1,
        pricePerDay: 1000,
        brand: 'Toyota',
        model: 'Camry',
        licensePlate: 'ABC123'
      };

      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await priceCalculationService.calculateRentalPrice(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-03')
      );

      expect(result.days).toBe(2);
      expect(result.breakdown.pricePerDay).toBe(1000);
      expect(result.breakdown.numberOfDays).toBe(2);
      expect(result.breakdown.basePrice).toBe(2000);
      expect(result.breakdown.platformFee).toBe(300);
      expect(result.breakdown.platformFeePercentage).toBe(15);
      expect(result.breakdown.insurance).toBe(100);
      expect(result.breakdown.subtotal).toBe(2400);
      expect(result.breakdown.taxes).toBe(432);
      expect(result.totalPrice).toBe(2832);
      expect(result.currency).toBe('INR');
    });

    it('should throw error if vehicle not found', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        priceCalculationService.calculateRentalPrice(999, new Date(), new Date())
      ).rejects.toThrow('Vehicle not found');
    });

    it('should handle zero price per day (insurance still applies)', async () => {
      const mockVehicle = {
        id: 1,
        pricePerDay: 0,
        brand: 'Test',
        model: 'Car'
      };

      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await priceCalculationService.calculateRentalPrice(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-03')
      );

      expect(result.breakdown.basePrice).toBe(0);
      expect(result.breakdown.insurance).toBeGreaterThan(0);
    });

    it('should include vehicle info in result', async () => {
      const mockVehicle = {
        id: 1,
        pricePerDay: 500,
        brand: 'Honda',
        model: 'Civic',
        licensePlate: 'XYZ789'
      };

      prisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await priceCalculationService.calculateRentalPrice(
        1,
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(result.vehicle).toEqual({
        id: 1,
        brand: 'Honda',
        model: 'Civic',
        licensePlate: 'XYZ789'
      });
    });
  });

  describe('calculateRidePrice', () => {
    it('should calculate ride price per seat', async () => {
      const mockRide = {
        id: 1,
        pricePerSeat: 50,
        vehicle: {
          pricePerKm: 0
        }
      };

      prisma.ridePool.findUnique.mockResolvedValue(mockRide);

      const result = await priceCalculationService.calculateRidePrice(1, 2);

      expect(result.seatsBooked).toBe(2);
      expect(result.breakdown.pricePerSeat).toBe(50);
      expect(result.breakdown.numberOfSeats).toBe(2);
      expect(result.breakdown.basePrice).toBe(100);
      expect(result.breakdown.serviceFee).toBe(10);
      expect(result.breakdown.taxes).toBe(19.8);
      expect(result.totalPrice).toBe(129.8);
    });

    it('should use distance-based pricing when available', async () => {
      const mockRide = {
        id: 1,
        pricePerSeat: 50,
        vehicle: {
          pricePerKm: 5
        }
      };

      prisma.ridePool.findUnique.mockResolvedValue(mockRide);

      const result = await priceCalculationService.calculateRidePrice(1, 1, 20);

      expect(result.breakdown.pricingModel).toBe('distance');
      expect(result.breakdown.distance).toBe(20);
      expect(result.breakdown.distanceBasedPrice).toBe(100);
    });

    it('should throw error if ride not found', async () => {
      prisma.ridePool.findUnique.mockResolvedValue(null);

      await expect(
        priceCalculationService.calculateRidePrice(999, 1)
      ).rejects.toThrow('Ride not found');
    });
  });

  describe('calculateCancellationRefund', () => {
    it('should return 100% refund for 48+ hours notice', () => {
      const booking = { totalAmount: 100 };
      const departureTime = new Date(Date.now() + 49 * 60 * 60 * 1000);

      const result = priceCalculationService.calculateCancellationRefund(booking, departureTime);

      expect(result.refundPercentage).toBe(1.0);
      expect(result.refundPolicy).toBe('FULL_REFUND');
      expect(result.isEligibleForRefund).toBe(true);
    });

    it('should return 50% refund for 24-48 hours notice', () => {
      const booking = { totalAmount: 100, totalAmount: 100 };
      const departureTime = new Date(Date.now() + 36 * 60 * 60 * 1000);

      const result = priceCalculationService.calculateCancellationRefund(booking, departureTime);

      expect(result.refundPercentage).toBe(0.5);
      expect(result.refundPolicy).toBe('50% refund (24h+ notice)');
      expect(result.isEligibleForRefund).toBe(true);
    });

    it('should return 25% refund for 12-24 hours notice', () => {
      const booking = { totalAmount: 100 };
      const departureTime = new Date(Date.now() + 18 * 60 * 60 * 1000);

      const result = priceCalculationService.calculateCancellationRefund(booking, departureTime);

      expect(result.refundPercentage).toBe(0.25);
      expect(result.refundPolicy).toBe('25% refund (12h+ notice)');
      expect(result.isEligibleForRefund).toBe(true);
    });

    it('should return 0% refund for less than 12 hours notice', () => {
      const booking = { totalAmount: 100 };
      const departureTime = new Date(Date.now() + 6 * 60 * 60 * 1000);

      const result = priceCalculationService.calculateCancellationRefund(booking, departureTime);

      expect(result.refundPercentage).toBe(0);
      expect(result.refundPolicy).toBe('No refund (< 12h notice)');
      expect(result.isEligibleForRefund).toBe(false);
    });

    it('should return 0% refund for past trips', () => {
      const booking = { totalAmount: 100 };
      const departureTime = new Date(Date.now() - 1 * 60 * 60 * 1000);

      const result = priceCalculationService.calculateCancellationRefund(booking, departureTime);

      expect(result.refundPercentage).toBe(0);
      expect(result.refundPolicy).toBe('No refund (trip already started)');
      expect(result.isEligibleForRefund).toBe(false);
    });

    it('should deduct platform fee from refund when refund is available', () => {
      const booking = { totalAmount: 100 };
      const departureTime = new Date(Date.now() + 49 * 60 * 60 * 1000);

      const result = priceCalculationService.calculateCancellationRefund(booking, departureTime);

      expect(result.refundPercentage).toBe(1);
      expect(result.actualRefundToUser).toBeLessThan(result.refundAmount);
    });
  });

  describe('calculateBookingPrice', () => {
    it('should delegate to calculateRentalPrice for day rentals', async () => {
      const mockBooking = {
        id: 1,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-03'),
        ridePool: {
          vehicleId: 1,
          vehicle: {
            pricePerDay: 1000
          }
        }
      };

      prisma.booking.findUnique.mockResolvedValue(mockBooking);
      prisma.vehicle.findUnique.mockResolvedValue({
        id: 1,
        pricePerDay: 1000
      });

      const result = await priceCalculationService.calculateBookingPrice(1);

      expect(result.days).toBe(2);
      expect(result.totalPrice).toBe(2832);
    });
  });
});
