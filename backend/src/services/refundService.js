const { prisma } = require('../database/connection');
const priceCalculationService = require('./priceCalculationService');
const logger = require('../middleware/logger');

class RefundService {
  async getCancellationDetails(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ridePool: true }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      return {
        error: 'Booking is already cancelled',
        currentStatus: booking.status
      };
    }

    if (booking.status === 'COMPLETED') {
      return {
        error: 'Cannot cancel a completed booking',
        currentStatus: booking.status
      };
    }

    const refundInfo = priceCalculationService.calculateCancellationRefund(
      booking,
      booking.ridePool.departureTime
    );

    return {
      bookingId: booking.id,
      bookingStatus: booking.status,
      totalAmount: booking.totalAmount,
      ...refundInfo
    };
  }

  async processCancellationRefund(bookingId, userId, reason = null) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { ridePool: true }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      return {
        success: false,
        error: 'Booking is already cancelled'
      };
    }

    if (booking.status === 'COMPLETED' || booking.status === 'ACTIVE') {
      return {
        success: false,
        error: 'Cannot cancel a booking that is in progress or completed'
      };
    }

    const refundInfo = priceCalculationService.calculateCancellationRefund(
      booking,
      booking.ridePool.departureTime
    );

    const { razorpayPaymentId, seatsBooked } = booking;
    const seatsToRelease = seatsBooked || 1;

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: userId,
          cancellationReason: reason,
          refundStatus: refundInfo.isEligibleForRefund ? 'PENDING' : null,
          refundAmount: refundInfo.isEligibleForRefund ? refundInfo.actualRefundToUser : null
        },
        include: { rider: true }
      });

      await tx.ridePool.update({
        where: { id: booking.ridePoolId },
        data: {
          availableSeats: { increment: seatsToRelease },
          bookedSeats: { decrement: seatsToRelease }
        }
      });

      return cancelled;
    });

    if (refundInfo.isEligibleForRefund && razorpayPaymentId) {
      try {
        const payment = await prisma.payment.findFirst({
          where: { razorpayPaymentId }
        });

        if (payment) {
          const refund = await this.initiateRazorpayRefund(
            payment,
            refundInfo.actualRefundToUser,
            bookingId,
            reason
          );

          await prisma.booking.update({
            where: { id: bookingId },
            data: { refundStatus: 'PROCESSING' }
          });

          logger.info('Cancellation refund initiated', {
            bookingId,
            refundAmount: refundInfo.actualRefundToUser,
            razorpayRefundId: refund.id
          });

          return {
            success: true,
            booking: updatedBooking,
            refund: {
              amount: refundInfo.actualRefundToUser,
              razorpayRefundId: refund.id,
              status: 'PROCESSING',
              policy: refundInfo.refundPolicy
            }
          };
        }
      } catch (refundError) {
        logger.error('Refund processing failed', {
          bookingId,
          error: refundError.message
        });

        await prisma.booking.update({
          where: { id: bookingId },
          data: { refundStatus: 'FAILED' }
        });

        return {
          success: false,
          booking: updatedBooking,
          refund: {
            status: 'FAILED',
            error: refundError.message
          }
        };
      }
    }

    logger.info('Booking cancelled without refund', {
      bookingId,
      reason: refundInfo.refundPolicy
    });

    return {
      success: true,
      booking: updatedBooking,
      refund: refundInfo.isEligibleForRefund
        ? null
        : { status: 'NOT_APPLICABLE', reason: refundInfo.refundPolicy }
    };
  }

  async initiateRazorpayRefund(payment, amount, bookingId, reason) {
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(amount * 100),
      speed: 'optimum',
      notes: {
        bookingId: String(bookingId),
        reason: reason || 'User cancellation'
      }
    });

    await prisma.refund.create({
      data: {
        razorpayRefundId: refund.id,
        razorpayPaymentId: payment.razorpayPaymentId,
        paymentId: payment.id,
        amount,
        status: 'PROCESSING',
        speed: refund.speed,
        notes: { bookingId, reason }
      }
    });

    return refund;
  }

  async getRefundStatus(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        refunds: {
          include: { payment: true }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const latestRefund = booking.refunds[0];

    if (!latestRefund) {
      return {
        bookingId,
        refundStatus: booking.refundStatus || 'NOT_APPLICABLE',
        refundAmount: booking.refundAmount
      };
    }

    return {
      bookingId,
      refundStatus: latestRefund.status,
      refundAmount: latestRefund.amount,
      razorpayRefundId: latestRefund.razorpayRefundId,
      processedAt: latestRefund.processedAt,
      speed: latestRefund.speed
    };
  }

  async processWebhookRefundUpdate(refundData) {
    const { razorpayRefundId, status } = refundData;

    const refund = await prisma.refund.findUnique({
      where: { razorpayRefundId }
    });

    if (!refund) {
      logger.warn('Refund webhook received for unknown refund', { razorpayRefundId });
      return;
    }

    const updateData = { status: status.toUpperCase() };
    if (status === 'processed') {
      updateData.processedAt = new Date();
    }

    await prisma.refund.update({
      where: { id: refund.id },
      data: updateData
    });

    if (status === 'processed') {
      const payment = await prisma.payment.findUnique({
        where: { id: refund.paymentId }
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: refund.paymentId },
          data: {
            refundedAmount: (payment.refundedAmount || 0) + refund.amount
          }
        });
      }
    }

    logger.info('Refund status updated via webhook', {
      razorpayRefundId,
      status
    });
  }
}

module.exports = new RefundService();
