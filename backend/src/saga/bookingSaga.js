const { SagaStep, sagaOrchestrator } = require('./sagaOrchestrator');
const { prisma } = require('../database/connection');
const paymentService = require('../services/paymentService');
const rideService = require('../services/rideService');
const logger = require('../middleware/logger');

async function reserveSeatStep(context) {
  logger.info('Booking Saga: Step 1 - Reserving seat', { 
    ridePoolId: context.ridePoolId, 
    riderId: context.riderId 
  });

  const ride = await prisma.ridePool.findUnique({
    where: { id: context.ridePoolId }
  });

  if (!ride) {
    return { success: false, error: 'Ride not found' };
  }

  if (ride.availableSeats < 1) {
    return { success: false, error: 'No seats available' };
  }

  const updatedRide = await prisma.ridePool.update({
    where: { id: context.ridePoolId },
    data: {
      availableSeats: { decrement: 1 },
      bookedSeats: { increment: 1 }
    }
  });

  const rideRequest = await prisma.rideRequest.create({
    data: {
      ridePoolId: context.ridePoolId,
      riderId: context.riderId,
      status: 'PENDING',
      pickupLocation: context.pickupLocation,
      dropLocation: context.dropLocation
    }
  });

  logger.info('Booking Saga: Seat reserved', { 
    rideRequestId: rideRequest.id,
    remainingSeats: updatedRide.availableSeats 
  });

  return {
    success: true,
    rideRequestId: rideRequest.id,
    ridePoolId: context.ridePoolId,
    availableSeats: updatedRide.availableSeats
  };
}

async function releaseSeatCompensation(context) {
  logger.info('Booking Saga: Compensating - Releasing seat', {
    ridePoolId: context.ridePoolId
  });

  try {
    await prisma.ridePool.update({
      where: { id: context.ridePoolId },
      data: {
        availableSeats: { increment: 1 },
        bookedSeats: { decrement: 1 }
      }
    });

    if (context.reserveSeat?.rideRequestId) {
      await prisma.rideRequest.update({
        where: { id: context.reserveSeat.rideRequestId },
        data: { status: 'CANCELLED' }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Booking Saga: Seat release compensation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function processPaymentStep(context) {
  logger.info('Booking Saga: Step 2 - Processing payment', {
    rideRequestId: context.reserveSeat.rideRequestId,
    amount: context.amount
  });

  try {
    const order = await paymentService.createOrder(context.amount, 'INR', {
      userId: context.riderId,
      ridePoolId: context.ridePoolId,
      rideRequestId: context.reserveSeat.rideRequestId,
      notes: {
        type: 'RIDE_BOOKING',
        pickup: context.pickupLocation?.address,
        drop: context.dropLocation?.address
      }
    });

    logger.info('Booking Saga: Payment order created', { orderId: order.orderId });

    return {
      success: true,
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    logger.error('Booking Saga: Payment processing failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function cancelPaymentCompensation(context) {
  logger.info('Booking Saga: Compensating - Cancelling payment', {
    orderId: context.processPayment?.orderId
  });

  return { success: true };
}

async function approveRequestStep(context) {
  logger.info('Booking Saga: Step 3 - Approving request', {
    rideRequestId: context.reserveSeat.rideRequestId
  });

  try {
    await prisma.rideRequest.update({
      where: { id: context.reserveSeat.rideRequestId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date()
      }
    });

    logger.info('Booking Saga: Request approved', {
      rideRequestId: context.reserveSeat.rideRequestId
    });

    return { success: true };
  } catch (error) {
    logger.error('Booking Saga: Request approval failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function rejectRequestCompensation(context) {
  logger.info('Booking Saga: Compensating - Rejecting request', {
    rideRequestId: context.reserveSeat.rideRequestId
  });

  try {
    await prisma.rideRequest.update({
      where: { id: context.reserveSeat.rideRequestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: 'Booking cancelled due to payment failure'
      }
    });

    return { success: true };
  } catch (error) {
    logger.error('Booking Saga: Request rejection compensation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function createBookingStep(context) {
  logger.info('Booking Saga: Step 4 - Creating booking', {
    rideRequestId: context.reserveSeat.rideRequestId
  });

  try {
    const booking = await prisma.booking.create({
      data: {
        ridePoolId: context.ridePoolId,
        riderId: context.riderId,
        rideRequestId: context.reserveSeat.rideRequestId,
        status: 'CONFIRMED',
        pickupLocation: context.pickupLocation,
        dropLocation: context.dropLocation,
        totalAmount: context.amount,
        paymentOrderId: context.processPayment?.orderId
      }
    });

    logger.info('Booking Saga: Booking created', { bookingId: booking.id });

    return {
      success: true,
      bookingId: booking.id
    };
  } catch (error) {
    logger.error('Booking Saga: Booking creation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function cancelBookingCompensation(context) {
  logger.info('Booking Saga: Compensating - Cancelling booking', {
    bookingId: context.createBooking?.bookingId
  });

  try {
    if (context.createBooking?.bookingId) {
      await prisma.booking.update({
        where: { id: context.createBooking.bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Booking Saga: Booking cancellation compensation failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

const bookingSagaSteps = [
  new SagaStep('reserveSeat', reserveSeatStep, releaseSeatCompensation),
  new SagaStep('processPayment', processPaymentStep, cancelPaymentCompensation),
  new SagaStep('approveRequest', approveRequestStep, rejectRequestCompensation),
  new SagaStep('createBooking', createBookingStep, cancelBookingCompensation)
];

sagaOrchestrator.register('BOOKING', bookingSagaSteps);

async function executeBookingSaga(context) {
  return await sagaOrchestrator.execute('BOOKING', context);
}

module.exports = {
  executeBookingSaga,
  bookingSagaSteps,
  reserveSeatStep,
  processPaymentStep,
  approveRequestStep,
  createBookingStep
};
