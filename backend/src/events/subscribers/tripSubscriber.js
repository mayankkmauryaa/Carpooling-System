const KafkaConfig = require('../config/kafka');
const eventBus = require('../eventBus');
const PaymentPublisher = require('../publishers/paymentPublisher');
const NotificationPublisher = require('../publishers/notificationPublisher');
const emailService = require('../services/emailService');
const logger = require('../middleware/logger');

class TripSubscriber {
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
        groupId: `${KafkaConfig.groupId}-trip`,
        sessionTimeout: KafkaConfig.consumer.sessionTimeout,
        heartbeatInterval: KafkaConfig.consumer.heartbeatInterval
      });

      await consumer.connect();
      await consumer.subscribe({ 
        topic: KafkaConfig.topics.tripEvents, 
        fromBeginning: false 
      });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const event = JSON.parse(message.value.toString());
          await this.handleTripEvent(event);
        }
      });

      this.consumers.push(consumer);
      logger.info('TripSubscriber: Started consuming from Kafka');
    } catch (error) {
      logger.error('TripSubscriber: Failed to start Kafka consumer', { error: error.message });
      this.startInMemorySubscriptions();
    }
  }

  startInMemorySubscriptions() {
    eventBus.on('TRIP_STARTED', this.handleTripStarted.bind(this));
    eventBus.on('TRIP_COMPLETED', this.handleTripCompleted.bind(this));
    eventBus.on('TRIP_CANCELLED', this.handleTripCancelled.bind(this));
    eventBus.on('RIDE_REQUEST_RECEIVED', this.handleRideRequestReceived.bind(this));
    logger.info('TripSubscriber: Started in-memory subscriptions');
  }

  async handleTripEvent(event) {
    try {
      switch (event.type) {
        case 'TRIP_STARTED':
          await this.handleTripStarted(event);
          break;
        case 'TRIP_COMPLETED':
          await this.handleTripCompleted(event);
          break;
        case 'TRIP_CANCELLED':
          await this.handleTripCancelled(event);
          break;
        case 'RIDE_REQUEST_RECEIVED':
          await this.handleRideRequestReceived(event);
          break;
        case 'RIDE_REQUEST_APPROVED':
          await this.handleRideRequestApproved(event);
          break;
        case 'RIDE_REQUEST_REJECTED':
          await this.handleRideRequestRejected(event);
          break;
        default:
          logger.debug('TripSubscriber: Unknown event type', { type: event.type });
      }
    } catch (error) {
      logger.error('TripSubscriber: Error handling event', { 
        type: event.type, 
        error: error.message 
      });
    }
  }

  async handleTripStarted(event) {
    logger.info('TripSubscriber: Processing TRIP_STARTED', { tripId: event.data.tripId });

    for (const riderId of event.data.riderIds) {
      await NotificationPublisher.publishPushNotification({
        userId: riderId,
        title: 'Your ride has started!',
        body: 'The driver has started the trip. Track your ride in real-time.',
        payload: { tripId: event.data.tripId, type: 'trip_started' }
      });
    }
  }

  async handleTripCompleted(event) {
    logger.info('TripSubscriber: Processing TRIP_COMPLETED', { tripId: event.data.tripId });

    await this.processPaymentAfterTrip(event.data);

    await NotificationPublisher.publishPushNotification({
      userId: event.data.driverId,
      title: 'Trip completed!',
      body: `Your trip #${event.data.tripId} has been completed. Fare: $${event.data.totalFare}`,
      payload: { tripId: event.data.tripId, type: 'trip_completed' }
    });

    for (const riderId of event.data.riderIds) {
      await NotificationPublisher.publishPushNotification({
        userId: riderId,
        title: 'Trip completed!',
        body: `You have arrived at your destination. Total: $${event.data.totalFare}`,
        payload: { tripId: event.data.tripId, type: 'trip_completed' }
      });

      await NotificationPublisher.publishEmailNotification({
        type: 'trip_completion',
        to: riderId.email,
        subject: 'Your trip has been completed',
        template: 'tripCompletion',
        data: event.data
      });
    }
  }

  async handleTripCancelled(event) {
    logger.info('TripSubscriber: Processing TRIP_CANCELLED', { tripId: event.data.tripId });

    await NotificationPublisher.publishPushNotification({
      userId: event.data.driverId,
      title: 'Trip cancelled',
      body: `Trip #${event.data.tripId} has been cancelled. Reason: ${event.data.reason}`,
      payload: { tripId: event.data.tripId, type: 'trip_cancelled' }
    });

    for (const riderId of event.data.riderIds) {
      await NotificationPublisher.publishPushNotification({
        userId: riderId,
        title: 'Trip cancelled',
        body: `Your trip #${event.data.tripId} has been cancelled.`,
        payload: { tripId: event.data.tripId, type: 'trip_cancelled' }
      });

      await NotificationPublisher.publishEmailNotification({
        type: 'trip_cancellation',
        to: riderId.email,
        subject: 'Trip Cancelled',
        template: 'tripCancellation',
        data: { ...event.data, reason: event.data.reason }
      });
    }
  }

  async handleRideRequestReceived(event) {
    logger.info('TripSubscriber: Processing RIDE_REQUEST_RECEIVED', { 
      requestId: event.data.requestId 
    });

    await NotificationPublisher.publishRideRequestNotification({
      driverId: event.data.driverId,
      riderId: event.data.riderId,
      rideId: event.data.ridePoolId,
      pickupLocation: event.data.pickupLocation,
      dropLocation: event.data.dropLocation
    });
  }

  async handleRideRequestApproved(event) {
    logger.info('TripSubscriber: Processing RIDE_REQUEST_APPROVED', { 
      requestId: event.data.requestId 
    });

    await NotificationPublisher.publishRideConfirmationNotification({
      riderId: event.data.riderId,
      rideId: event.data.ridePoolId,
      driverName: event.data.driverName,
      vehicleDetails: event.data.vehicleDetails,
      departureTime: event.data.departureTime
    });
  }

  async handleRideRequestRejected(event) {
    logger.info('TripSubscriber: Processing RIDE_REQUEST_REJECTED', { 
      requestId: event.data.requestId 
    });

    await NotificationPublisher.publishPushNotification({
      userId: event.data.riderId,
      title: 'Request rejected',
      body: `Your ride request was rejected. Reason: ${event.data.rejectionReason || 'No reason provided'}`,
      payload: { rideId: event.data.ridePoolId, type: 'request_rejected' }
    });
  }

  async processPaymentAfterTrip(tripData) {
    try {
      await PaymentPublisher.publishPayoutInitiated({
        id: `payout-${tripData.tripId}`,
        driverId: tripData.driverId,
        tripId: tripData.tripId,
        amount: tripData.totalFare * 0.8,
        status: 'PROCESSING'
      });
    } catch (error) {
      logger.error('TripSubscriber: Failed to initiate payout', { 
        tripId: tripData.tripId, 
        error: error.message 
      });
    }
  }

  async stop() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
    this.consumers = [];
    eventBus.removeAllListeners('TRIP_STARTED');
    eventBus.removeAllListeners('TRIP_COMPLETED');
    eventBus.removeAllListeners('TRIP_CANCELLED');
    eventBus.removeAllListeners('RIDE_REQUEST_RECEIVED');
    eventBus.removeAllListeners('RIDE_REQUEST_APPROVED');
    eventBus.removeAllListeners('RIDE_REQUEST_REJECTED');
    logger.info('TripSubscriber: Stopped');
  }
}

module.exports = TripSubscriber;
