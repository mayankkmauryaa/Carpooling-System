const eventBus = require('../eventBus');
const { prisma } = require('../../database/connection');
const logger = require('../../middleware/logger');

class PaymentConsumer {
  constructor() {
    this.setup();
  }

  setup() {
    eventBus.on('payment.initiated', this.handlePaymentInitiated.bind(this));
    eventBus.on('payment.captured', this.handlePaymentCaptured.bind(this));
    eventBus.on('payment.failed', this.handlePaymentFailed.bind(this));
    eventBus.on('payment.refund_initiated', this.handleRefundInitiated.bind(this));
    eventBus.on('payment.refund.processed', this.handleRefundProcessed.bind(this));
    eventBus.on('payment.refund.failed', this.handleRefundFailed.bind(this));
    eventBus.on('payout.calculate', this.handlePayoutCalculate.bind(this));
    eventBus.on('payout.processed', this.handlePayoutProcessed.bind(this));

    logger.info('PaymentConsumer initialized and listening for events');
  }

  async handlePaymentInitiated(event) {
    try {
      logger.info('Processing payment.initiated event', {
        bookingId: event.bookingId,
        orderId: event.orderId
      });

      await prisma.payment.create({
        data: {
          razorpayOrderId: event.orderId,
          userId: event.userId,
          amount: event.amount,
          status: 'PENDING',
          notes: { bookingId: event.bookingId }
        }
      });

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'PAYMENT_PENDING',
        title: 'Payment Pending',
        message: 'Your payment is being processed.',
        data: { bookingId: event.bookingId }
      });
    } catch (error) {
      logger.error('Error processing payment.initiated', { error: error.message, event });
    }
  }

  async handlePaymentCaptured(event) {
    try {
      logger.info('Processing payment.captured event', {
        paymentId: event.paymentId,
        bookingId: event.bookingId
      });

      const payment = await prisma.payment.update({
        where: { razorpayOrderId: event.orderId },
        data: {
          razorpayPaymentId: event.paymentId,
          status: 'CAPTURED',
          capturedAmount: event.amount,
          capturedAt: new Date()
        }
      });

      if (event.bookingId) {
        await prisma.booking.update({
          where: { id: event.bookingId },
          data: {
            status: 'PAID',
            razorpayPaymentId: event.paymentId,
            paymentOrderId: event.orderId
          }
        });

        eventBus.emit('booking.confirmed', {
          bookingId: event.bookingId,
          paymentId: event.paymentId
        });
      }

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: 'Your payment has been processed successfully.',
        data: { bookingId: event.bookingId }
      });
    } catch (error) {
      logger.error('Error processing payment.captured', { error: error.message, event });
    }
  }

  async handlePaymentFailed(event) {
    try {
      logger.info('Processing payment.failed event', {
        orderId: event.orderId,
        error: event.error
      });

      await prisma.payment.update({
        where: { razorpayOrderId: event.orderId },
        data: { status: 'FAILED' }
      });

      if (event.bookingId) {
        await prisma.booking.update({
          where: { id: event.bookingId },
          data: {
            status: 'FAILED',
            sagaState: 'FAILED'
          }
        });

        eventBus.emit('seat.released', {
          ridePoolId: event.ridePoolId,
          seats: event.seats || 1
        });

        eventBus.emit('booking.confirmation_failed', {
          bookingId: event.bookingId,
          reason: event.error
        });
      }

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
        data: { bookingId: event.bookingId, error: event.error }
      });
    } catch (error) {
      logger.error('Error processing payment.failed', { error: error.message, event });
    }
  }

  async handleRefundInitiated(event) {
    try {
      logger.info('Processing payment.refund_initiated event', {
        bookingId: event.bookingId,
        amount: event.amount
      });

      await prisma.booking.update({
        where: { id: event.bookingId },
        data: {
          refundStatus: 'PROCESSING',
          refundAmount: event.amount
        }
      });

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'REFUND_INITIATED',
        title: 'Refund Initiated',
        message: `Your refund of ₹${event.amount} is being processed.`,
        data: { bookingId: event.bookingId }
      });
    } catch (error) {
      logger.error('Error processing refund_initiated', { error: error.message, event });
    }
  }

  async handleRefundProcessed(event) {
    try {
      logger.info('Processing payment.refund.processed event', {
        refundId: event.refundId,
        bookingId: event.bookingId
      });

      await prisma.refund.update({
        where: { razorpayRefundId: event.refundId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      await prisma.booking.update({
        where: { id: event.bookingId },
        data: { refundStatus: 'COMPLETED' }
      });

      const payment = await prisma.refund.findUnique({
        where: { razorpayRefundId: event.refundId },
        include: { payment: true }
      });

      if (payment?.payment) {
        await prisma.payment.update({
          where: { id: payment.payment.id },
          data: {
            refundedAmount: (payment.payment.refundedAmount || 0) + event.amount
          }
        });
      }

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'REFUND_COMPLETED',
        title: 'Refund Completed',
        message: `Your refund of ₹${event.amount} has been processed.`,
        data: { bookingId: event.bookingId }
      });
    } catch (error) {
      logger.error('Error processing refund.processed', { error: error.message, event });
    }
  }

  async handleRefundFailed(event) {
    try {
      logger.info('Processing payment.refund.failed event', {
        bookingId: event.bookingId,
        error: event.error
      });

      await prisma.refund.update({
        where: { razorpayRefundId: event.refundId },
        data: { status: 'FAILED' }
      });

      await prisma.booking.update({
        where: { id: event.bookingId },
        data: { refundStatus: 'FAILED' }
      });

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'REFUND_FAILED',
        title: 'Refund Failed',
        message: 'Your refund could not be processed. Please contact support.',
        data: { bookingId: event.bookingId }
      });
    } catch (error) {
      logger.error('Error processing refund.failed', { error: error.message, event });
    }
  }

  async handlePayoutCalculate(event) {
    try {
      logger.info('Processing payout.calculate event', {
        tripId: event.tripId,
        driverId: event.driverId
      });

      const trip = await prisma.trip.findUnique({
        where: { id: event.tripId }
      });

      if (!trip) {
        logger.error('Trip not found for payout calculation', { tripId: event.tripId });
        return;
      }

      const platformFeePercentage = 0.20;
      const platformFee = trip.totalFare * platformFeePercentage;
      const driverEarnings = trip.totalFare - platformFee;

      await prisma.payout.create({
        data: {
          driverId: event.driverId,
          tripId: event.tripId,
          amount: driverEarnings,
          platformFee,
          status: 'PENDING'
        }
      });

      logger.info('Payout calculated', {
        tripId: event.tripId,
        totalFare: trip.totalFare,
        platformFee,
        driverEarnings
      });

      eventBus.emit('payout.process', {
        tripId: event.tripId,
        driverId: event.driverId,
        amount: driverEarnings
      });
    } catch (error) {
      logger.error('Error processing payout.calculate', { error: error.message, event });
    }
  }

  async handlePayoutProcessed(event) {
    try {
      logger.info('Processing payout.processed event', {
        tripId: event.tripId,
        payoutId: event.payoutId
      });

      await prisma.payout.update({
        where: { id: event.payoutId },
        data: {
          status: 'COMPLETED',
          razorpayPayoutId: event.razorpayPayoutId,
          processedAt: new Date()
        }
      });

      const payout = await prisma.payout.findUnique({
        where: { id: event.payoutId }
      });

      if (payout) {
        const driver = await prisma.user.findUnique({
          where: { id: payout.driverId }
        });

        if (driver) {
          eventBus.emit('notification.send', {
            userId: driver.id,
            type: 'PAYOUT_RECEIVED',
            title: 'Payout Received',
            message: `Your payout of ₹${payout.amount} has been credited.`,
            data: { tripId: event.tripId, amount: payout.amount }
          });
        }
      }
    } catch (error) {
      logger.error('Error processing payout.processed', { error: error.message, event });
    }
  }
}

module.exports = new PaymentConsumer();
