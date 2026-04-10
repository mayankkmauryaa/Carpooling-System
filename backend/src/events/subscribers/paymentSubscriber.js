const KafkaConfig = require('../config/kafka');
const eventBus = require('../eventBus');
const NotificationPublisher = require('../publishers/notificationPublisher');
const logger = require('../middleware/logger');

class PaymentSubscriber {
  constructor(kafka) {
    this.kafka = kafka;
    this.consumers = [];
  }

  async start() {
    if (!KafkaConfig.isEnabled) {
      this.startInMemorySubscriptions();
      return;
    }

    try {
      const consumer = this.kafka.consumer({ 
        groupId: `${KafkaConfig.groupId}-payment`,
        sessionTimeout: KafkaConfig.consumer.sessionTimeout,
        heartbeatInterval: KafkaConfig.consumer.heartbeatInterval
      });

      await consumer.connect();
      await consumer.subscribe({ 
        topic: KafkaConfig.topics.paymentEvents, 
        fromBeginning: false 
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const event = JSON.parse(message.value.toString());
          await this.handlePaymentEvent(event);
        }
      });

      this.consumers.push(consumer);
      logger.info('PaymentSubscriber: Started consuming from Kafka');
    } catch (error) {
      logger.error('PaymentSubscriber: Failed to start Kafka consumer', { error: error.message });
      this.startInMemorySubscriptions();
    }
  }

  startInMemorySubscriptions() {
    eventBus.on('PAYMENT_INITIATED', this.handlePaymentInitiated.bind(this));
    eventBus.on('PAYMENT_SUCCESS', this.handlePaymentSuccess.bind(this));
    eventBus.on('PAYMENT_FAILED', this.handlePaymentFailed.bind(this));
    eventBus.on('PAYMENT_REFUNDED', this.handlePaymentRefunded.bind(this));
    eventBus.on('PAYOUT_COMPLETED', this.handlePayoutCompleted.bind(this));
    eventBus.on('WALLET_RECHARGED', this.handleWalletRecharged.bind(this));
    eventBus.on('WALLET_DEBITED', this.handleWalletDebited.bind(this));
    logger.info('PaymentSubscriber: Started in-memory subscriptions');
  }

  async handlePaymentEvent(event) {
    try {
      switch (event.type) {
        case 'PAYMENT_INITIATED':
          await this.handlePaymentInitiated(event);
          break;
        case 'PAYMENT_SUCCESS':
          await this.handlePaymentSuccess(event);
          break;
        case 'PAYMENT_FAILED':
          await this.handlePaymentFailed(event);
          break;
        case 'PAYMENT_REFUNDED':
          await this.handlePaymentRefunded(event);
          break;
        case 'PAYOUT_COMPLETED':
          await this.handlePayoutCompleted(event);
          break;
        case 'WALLET_RECHARGED':
          await this.handleWalletRecharged(event);
          break;
        case 'WALLET_DEBITED':
          await this.handleWalletDebited(event);
          break;
        default:
          logger.debug('PaymentSubscriber: Unknown event type', { type: event.type });
      }
    } catch (error) {
      logger.error('PaymentSubscriber: Error handling event', { 
        type: event.type, 
        error: error.message 
      });
    }
  }

  async handlePaymentInitiated(event) {
    logger.info('PaymentSubscriber: Processing PAYMENT_INITIATED', { orderId: event.data.orderId });
  }

  async handlePaymentSuccess(event) {
    logger.info('PaymentSubscriber: Processing PAYMENT_SUCCESS', { 
      orderId: event.data.orderId,
      paymentId: event.data.paymentId 
    });

    await NotificationPublisher.publishPaymentConfirmationNotification({
      userId: event.data.userId,
      tripId: event.data.tripId,
      amount: event.data.amount,
      paymentId: event.data.paymentId
    });
  }

  async handlePaymentFailed(event) {
    logger.info('PaymentSubscriber: Processing PAYMENT_FAILED', { 
      orderId: event.data.orderId,
      error: event.data.error 
    });

    await NotificationPublisher.publishPushNotification({
      userId: event.data.userId,
      title: 'Payment Failed',
      body: `Your payment for trip #${event.data.tripId} failed. Please try again.`,
      payload: { tripId: event.data.tripId, type: 'payment_failed' }
    });
  }

  async handlePaymentRefunded(event) {
    logger.info('PaymentSubscriber: Processing PAYMENT_REFUNDED', { 
      refundId: event.data.refundId 
    });

    await NotificationPublisher.publishPushNotification({
      userId: event.data.userId,
      title: 'Refund Processed',
      body: `Your refund of $${event.data.amount} has been processed.`,
      payload: { refundId: event.data.refundId, type: 'refund_processed' }
    });
  }

  async handlePayoutCompleted(event) {
    logger.info('PaymentSubscriber: Processing PAYOUT_COMPLETED', { 
      payoutId: event.data.payoutId,
      driverId: event.data.driverId 
    });

    await NotificationPublisher.publishPayoutNotification({
      driverId: event.data.driverId,
      tripId: event.data.tripId,
      amount: event.data.amount,
      payoutId: event.data.payoutId
    });
  }

  async handleWalletRecharged(event) {
    logger.info('PaymentSubscriber: Processing WALLET_RECHARGED', { 
      transactionId: event.data.transactionId 
    });

    await NotificationPublisher.publishPushNotification({
      userId: event.data.userId,
      title: 'Wallet Recharged',
      body: `Your wallet has been recharged with $${event.data.amount}. New balance: $${event.data.newBalance}`,
      payload: { transactionId: event.data.transactionId, type: 'wallet_recharged' }
    });
  }

  async handleWalletDebited(event) {
    logger.info('PaymentSubscriber: Processing WALLET_DEBITED', { 
      transactionId: event.data.transactionId 
    });

    await NotificationPublisher.publishPushNotification({
      userId: event.data.userId,
      title: 'Wallet Debited',
      body: `$${event.data.amount} has been deducted from your wallet. Balance: $${event.data.newBalance}`,
      payload: { transactionId: event.data.transactionId, type: 'wallet_debited' }
    });
  }

  async stop() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
    this.consumers = [];
    eventBus.removeAllListeners('PAYMENT_INITIATED');
    eventBus.removeAllListeners('PAYMENT_SUCCESS');
    eventBus.removeAllListeners('PAYMENT_FAILED');
    eventBus.removeAllListeners('PAYMENT_REFUNDED');
    eventBus.removeAllListeners('PAYOUT_COMPLETED');
    eventBus.removeAllListeners('WALLET_RECHARGED');
    eventBus.removeAllListeners('WALLET_DEBITED');
    logger.info('PaymentSubscriber: Stopped');
  }
}

module.exports = PaymentSubscriber;
