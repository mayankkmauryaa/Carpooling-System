const { SagaStep, sagaOrchestrator } = require('./sagaOrchestrator');
const { prisma } = require('../database/connection');
const eventBus = require('../events/eventBus');
const priceCalculationService = require('../services/priceCalculationService');
const logger = require('../middleware/logger');

async function validateBookingStep(context) {
  logger.info('Cancellation Saga: Validating booking', { bookingId: context.bookingId });

  const booking = await prisma.booking.findUnique({
    where: { id: context.bookingId },
    include: { ridePool: true }
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status === 'CANCELLED') {
    throw new Error('Booking is already cancelled');
  }

  if (['COMPLETED', 'ACTIVE', 'IN_PROGRESS'].includes(booking.status)) {
    throw new Error(`Cannot cancel booking with status: ${booking.status}`);
  }

  context.booking = booking;
  context.ridePoolId = booking.ridePoolId;
  context.seats = booking.seatsBooked || 1;
  context.riderId = booking.riderId;

  const refundInfo = priceCalculationService.calculateCancellationRefund(
    booking,
    booking.ridePool.departureTime
  );

  context.refundInfo = refundInfo;

  return {
    success: true,
    bookingStatus: booking.status,
    refundEligible: refundInfo.isEligibleForRefund,
    refundAmount: refundInfo.actualRefundToUser
  };
}

async function updateBookingStatusStep(context) {
  logger.info('Cancellation Saga: Updating booking status', { bookingId: context.bookingId });

  const booking = await prisma.booking.update({
    where: { id: context.bookingId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelledBy: context.userId,
      cancellationReason: context.reason || 'User requested cancellation',
      refundAmount: context.refundInfo.actualRefundToUser,
      refundStatus: context.refundInfo.isEligibleForRefund ? 'PENDING' : null,
      sagaState: 'IN_PROGRESS'
    }
  });

  eventBus.emit('booking.cancelled', {
    bookingId: booking.id,
    userId: context.userId,
    reason: context.reason
  });

  return { success: true, newStatus: 'CANCELLED' };
}

async function releaseSeatsStep(context) {
  logger.info('Cancellation Saga: Releasing seats', { 
    ridePoolId: context.ridePoolId,
    seats: context.seats,
    currentStatus: context.booking.status
  });

  const cancellableStatuses = ['CONFIRMED', 'APPROVED', 'PAID', 'PENDING'];
  
  if (cancellableStatuses.includes(context.booking.status)) {
    await prisma.ridePool.update({
      where: { id: context.ridePoolId },
      data: {
        availableSeats: { increment: context.seats },
        bookedSeats: { decrement: context.seats }
      }
    });

    eventBus.emit('seat.released', {
      ridePoolId: context.ridePoolId,
      seats: context.seats
    });
    
    logger.info('Cancellation Saga: Seats released successfully', {
      ridePoolId: context.ridePoolId,
      seatsReleased: context.seats
    });
  } else {
    logger.info('Cancellation Saga: No seats to release', {
      ridePoolId: context.ridePoolId,
      status: context.booking.status
    });
  }

  return { success: true, seatsReleased: context.seats };
}

async function processRefundStep(context) {
  logger.info('Cancellation Saga: Processing refund', {
    bookingId: context.bookingId,
    refundAmount: context.refundInfo.actualRefundToUser,
    eligible: context.refundInfo.isEligibleForRefund
  });

  if (!context.refundInfo.isEligibleForRefund) {
    return {
      success: true,
      refunded: false,
      reason: context.refundInfo.refundPolicy
    };
  }

  if (!context.booking.razorpayPaymentId) {
    await prisma.booking.update({
      where: { id: context.bookingId },
      data: {
        refundStatus: 'NOT_APPLICABLE',
        sagaState: 'COMPLETED'
      }
    });

    return {
      success: true,
      refunded: false,
      reason: 'No payment found'
    };
  }

  const payment = await prisma.payment.findFirst({
    where: { razorpayPaymentId: context.booking.razorpayPaymentId }
  });

  if (!payment) {
    await prisma.booking.update({
      where: { id: context.bookingId },
      data: { refundStatus: 'NOT_APPLICABLE' }
    });

    return {
      success: true,
      refunded: false,
      reason: 'Payment record not found'
    };
  }

  eventBus.emit('refund.process', {
    bookingId: context.bookingId,
    userId: context.userId,
    amount: context.refundInfo.actualRefundToUser,
    paymentId: payment.id,
    reason: context.reason || 'User cancellation'
  });

  await prisma.booking.update({
    where: { id: context.bookingId },
    data: { refundStatus: 'PROCESSING' }
  });

  return {
    success: true,
    refunded: true,
    refundAmount: context.refundInfo.actualRefundToUser,
    status: 'PROCESSING'
  };
}

async function sendNotificationStep(context) {
  logger.info('Cancellation Saga: Sending notification', { userId: context.userId });

  eventBus.emit('notification.send', {
    userId: context.userId,
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    message: context.refundInfo.isEligibleForRefund
      ? `Your booking has been cancelled. A refund of ₹${context.refundInfo.actualRefundToUser} will be processed.`
      : 'Your booking has been cancelled. No refund is applicable as per cancellation policy.',
    data: {
      bookingId: context.bookingId,
      refundAmount: context.refundInfo.actualRefundToUser,
      refundPolicy: context.refundInfo.refundPolicy
    }
  });

  return { success: true, notificationSent: true };
}

async function completeSagaStep(context) {
  logger.info('Cancellation Saga: Completing', { bookingId: context.bookingId });

  await prisma.booking.update({
    where: { id: context.bookingId },
    data: { sagaState: 'COMPLETED' }
  });

  return { success: true, sagaCompleted: true };
}

const cancellationSagaSteps = [
  new SagaStep('validateBooking', validateBookingStep),
  new SagaStep('updateBookingStatus', updateBookingStatusStep),
  new SagaStep('releaseSeats', releaseSeatsStep),
  new SagaStep('processRefund', processRefundStep),
  new SagaStep('sendNotification', sendNotificationStep),
  new SagaStep('completeSaga', completeSagaStep)
];

const cancellationCompensationSteps = [
  new SagaStep('validateBooking', validateBookingStep, async () => true),
  new SagaStep('restoreBookingStatus', async (context) => {
    await prisma.booking.update({
      where: { id: context.bookingId },
      data: {
        status: context.booking.status,
        cancelledAt: null,
        cancelledBy: null,
        cancellationReason: null,
        sagaState: 'ROLLED_BACK'
      }
    });
    return { success: true };
  }),
  new SagaStep('restoreSeats', async (context) => {
    await prisma.ridePool.update({
      where: { id: context.ridePoolId },
      data: {
        availableSeats: { decrement: context.seats },
        bookedSeats: { increment: context.seats }
      }
    });
    return { success: true };
  })
];

sagaOrchestrator.register('CANCELLATION', cancellationSagaSteps);
sagaOrchestrator.register('CANCELLATION_COMPENSATION', cancellationCompensationSteps);

async function executeCancellationSaga(bookingId, userId, reason = null) {
  return await sagaOrchestrator.execute('CANCELLATION', {
    bookingId,
    userId,
    reason
  });
}

module.exports = {
  cancellationSagaSteps,
  cancellationCompensationSteps,
  executeCancellationSaga
};
