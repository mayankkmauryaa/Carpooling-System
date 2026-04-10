const eventBus = require('../eventBus');
const KafkaConfig = require('../config/kafka');

class PaymentPublisher {
  static async publishPaymentInitiated(payment) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'PAYMENT_INITIATED',
      key: payment.orderId,
      data: {
        orderId: payment.orderId,
        userId: payment.userId,
        tripId: payment.tripId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        initiatedAt: new Date().toISOString()
      }
    });
  }

  static async publishPaymentSuccess(payment) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'PAYMENT_SUCCESS',
      key: payment.orderId,
      data: {
        orderId: payment.orderId,
        paymentId: payment.razorpayPaymentId,
        userId: payment.userId,
        tripId: payment.tripId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        capturedAt: payment.capturedAt,
        successAt: new Date().toISOString()
      }
    });
  }

  static async publishPaymentFailed(payment, error) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'PAYMENT_FAILED',
      key: payment.orderId,
      data: {
        orderId: payment.orderId,
        userId: payment.userId,
        tripId: payment.tripId,
        amount: payment.amount,
        currency: payment.currency,
        error: error.message,
        failedAt: new Date().toISOString()
      }
    });
  }

  static async publishPaymentRefunded(refund) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'PAYMENT_REFUNDED',
      key: refund.razorpayRefundId,
      data: {
        refundId: refund.razorpayRefundId,
        paymentId: refund.razorpayPaymentId,
        amount: refund.amount,
        status: refund.status,
        speed: refund.speed,
        refundedAt: new Date().toISOString()
      }
    });
  }

  static async publishPayoutInitiated(payout) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'PAYOUT_INITIATED',
      key: payout.id.toString(),
      data: {
        payoutId: payout.id,
        driverId: payout.driverId,
        tripId: payout.tripId,
        amount: payout.amount,
        status: payout.status,
        initiatedAt: new Date().toISOString()
      }
    });
  }

  static async publishPayoutCompleted(payout) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'PAYOUT_COMPLETED',
      key: payout.id.toString(),
      data: {
        payoutId: payout.id,
        driverId: payout.driverId,
        tripId: payout.tripId,
        amount: payout.amount,
        status: payout.status,
        razorpayPayoutId: payout.razorpayPayoutId,
        completedAt: new Date().toISOString()
      }
    });
  }

  static async publishWalletRecharged(transaction) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'WALLET_RECHARGED',
      key: transaction.id.toString(),
      data: {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        newBalance: transaction.balance,
        reference: transaction.reference,
        rechargedAt: new Date().toISOString()
      }
    });
  }

  static async publishWalletDebited(transaction) {
    await eventBus.publish(KafkaConfig.topics.paymentEvents, {
      type: 'WALLET_DEBITED',
      key: transaction.id.toString(),
      data: {
        transactionId: transaction.id,
        userId: transaction.userId,
        amount: transaction.amount,
        newBalance: transaction.balance,
        reference: transaction.reference,
        description: transaction.description,
        debitedAt: new Date().toISOString()
      }
    });
  }
}

module.exports = PaymentPublisher;
