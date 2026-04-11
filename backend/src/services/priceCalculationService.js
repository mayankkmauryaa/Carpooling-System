const { prisma } = require('../database/connection');

class PriceCalculationService {
  PLATFORM_FEE_PERCENTAGE = 0.15;
  TAX_PERCENTAGE = 0.18;
  INSURANCE_PER_DAY = 50;

  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }

  async calculateRentalPrice(vehicleId, startDate, endDate, additionalOptions = {}) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = this.calculateDays(start, end);

    const basePrice = days * (vehicle.pricePerDay || 0);
    const platformFee = basePrice * this.PLATFORM_FEE_PERCENTAGE;
    const insurance = days * this.INSURANCE_PER_DAY;
    const subtotal = basePrice + platformFee + insurance;
    const taxes = subtotal * this.TAX_PERCENTAGE;
    const totalPrice = subtotal + taxes;

    return {
      days,
      breakdown: {
        pricePerDay: vehicle.pricePerDay || 0,
        numberOfDays: days,
        basePrice: Math.round(basePrice * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        platformFeePercentage: this.PLATFORM_FEE_PERCENTAGE * 100,
        insurance: Math.round(insurance * 100) / 100,
        insurancePerDay: this.INSURANCE_PER_DAY,
        subtotal: Math.round(subtotal * 100) / 100,
        taxes: Math.round(taxes * 100) / 100,
        taxPercentage: this.TAX_PERCENTAGE * 100
      },
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: 'INR',
      vehicle: {
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate
      },
      period: {
        startDate: start,
        endDate: end
      }
    };
  }

  async calculateRidePrice(ridePoolId, numberOfSeats, distance = null) {
    const ride = await prisma.ridePool.findUnique({
      where: { id: ridePoolId },
      include: { vehicle: true }
    });

    if (!ride) {
      throw new Error('Ride not found');
    }

    let basePrice;
    let breakdown = {
      pricePerSeat: ride.pricePerSeat,
      numberOfSeats
    };

    if (distance && ride.vehicle?.pricePerKm > 0) {
      const distancePrice = distance * ride.vehicle.pricePerKm;
      const minimumPrice = ride.pricePerSeat * numberOfSeats;
      basePrice = Math.max(distancePrice, minimumPrice);
      breakdown = {
        ...breakdown,
        distance,
        pricePerKm: ride.vehicle.pricePerKm,
        distanceBasedPrice: Math.round(distancePrice * 100) / 100,
        seatBasedPrice: Math.round(minimumPrice * 100) / 100,
        pricingModel: 'distance'
      };
    } else {
      basePrice = ride.pricePerSeat * numberOfSeats;
      breakdown = {
        ...breakdown,
        pricingModel: 'seat'
      };
    }

    const serviceFee = basePrice * 0.10;
    const taxes = (basePrice + serviceFee) * this.TAX_PERCENTAGE;
    const totalPrice = basePrice + serviceFee + taxes;

    return {
      seatsBooked: numberOfSeats,
      breakdown: {
        ...breakdown,
        basePrice: Math.round(basePrice * 100) / 100,
        serviceFee: Math.round(serviceFee * 100) / 100,
        serviceFeePercentage: 10,
        taxes: Math.round(taxes * 100) / 100,
        taxPercentage: this.TAX_PERCENTAGE * 100
      },
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: 'INR'
    };
  }

  async calculateBookingPrice(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ridePool: {
          include: { vehicle: true }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.ridePool.vehicle?.pricePerDay > 0 && booking.startDate && booking.endDate) {
      return this.calculateRentalPrice(
        booking.ridePool.vehicleId,
        booking.startDate,
        booking.endDate
      );
    } else {
      return this.calculateRidePrice(booking.ridePoolId, 1);
    }
  }

  calculateCancellationRefund(booking, departureTime) {
    const now = new Date();
    const departure = new Date(departureTime);
    const hoursUntilTrip = (departure - now) / (1000 * 60 * 60);

    let refundPercentage;
    let refundPolicy;

    if (hoursUntilTrip >= 48) {
      refundPercentage = 1.0;
      refundPolicy = 'FULL_REFUND';
    } else if (hoursUntilTrip >= 24) {
      refundPercentage = 0.5;
      refundPolicy = '50% refund (24h+ notice)';
    } else if (hoursUntilTrip >= 12) {
      refundPercentage = 0.25;
      refundPolicy = '25% refund (12h+ notice)';
    } else if (hoursUntilTrip > 0) {
      refundPercentage = 0;
      refundPolicy = 'No refund (< 12h notice)';
    } else {
      refundPercentage = 0;
      refundPolicy = 'No refund (trip already started)';
    }

    const refundAmount = Math.round(booking.totalAmount * refundPercentage * 100) / 100;
    const platformFee = booking.totalAmount * this.PLATFORM_FEE_PERCENTAGE;
    const actualRefund = Math.round((booking.totalAmount - platformFee) * refundPercentage * 100) / 100;

    return {
      originalAmount: booking.totalAmount,
      refundPercentage,
      refundAmount,
      actualRefundToUser: actualRefund,
      platformFeeNonRefundable: Math.round(platformFee * (1 - refundPercentage) * 100) / 100,
      hoursUntilTrip: Math.round(hoursUntilTrip * 100) / 100,
      refundPolicy,
      isEligibleForRefund: refundPercentage > 0
    };
  }
}

module.exports = new PriceCalculationService();
