const eventBus = require('../eventBus');
const KafkaConfig = require('../config/kafka');

class NotificationPublisher {
  static async publishEmailNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'EMAIL_NOTIFICATION',
      key: notification.id?.toString() || `email-${Date.now()}`,
      data: {
        notificationId: notification.id,
        type: notification.type,
        to: notification.to,
        subject: notification.subject,
        template: notification.template,
        data: notification.data,
        priority: notification.priority || 'normal',
        scheduledAt: notification.scheduledAt || new Date().toISOString()
      }
    });
  }

  static async publishPushNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'PUSH_NOTIFICATION',
      key: notification.userId.toString(),
      data: {
        notificationId: notification.id,
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        data: notification.payload,
        platform: notification.platform || 'all',
        priority: notification.priority || 'normal',
        scheduledAt: notification.scheduledAt || new Date().toISOString()
      }
    });
  }

  static async publishRideRequestNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'RIDE_REQUEST_NOTIFICATION',
      key: notification.driverId.toString(),
      data: {
        notificationId: notification.id,
        type: 'RIDE_REQUEST',
        driverId: notification.driverId,
        riderId: notification.riderId,
        rideId: notification.rideId,
        pickupLocation: notification.pickupLocation,
        dropLocation: notification.dropLocation,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishRideConfirmationNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'RIDE_CONFIRMATION_NOTIFICATION',
      key: notification.riderId.toString(),
      data: {
        notificationId: notification.id,
        type: 'RIDE_CONFIRMED',
        riderId: notification.riderId,
        rideId: notification.rideId,
        driverName: notification.driverName,
        vehicleDetails: notification.vehicleDetails,
        departureTime: notification.departureTime,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishTripReminderNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'TRIP_REMINDER_NOTIFICATION',
      key: notification.userId.toString(),
      data: {
        notificationId: notification.id,
        type: 'TRIP_REMINDER',
        userId: notification.userId,
        tripId: notification.tripId,
        pickupLocation: notification.pickupLocation,
        dropLocation: notification.dropLocation,
        departureTime: notification.departureTime,
        minutesUntilTrip: notification.minutesUntilTrip,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishSOSAlertNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'SOS_ALERT_NOTIFICATION',
      key: notification.alertId.toString(),
      data: {
        notificationId: notification.id,
        type: 'SOS_ALERT',
        alertId: notification.alertId,
        userId: notification.userId,
        rideId: notification.rideId,
        location: notification.location,
        message: notification.message,
        severity: 'critical',
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishDriverLocationUpdate(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'DRIVER_LOCATION_UPDATE',
      key: notification.rideId.toString(),
      data: {
        rideId: notification.rideId,
        driverId: notification.driverId,
        latitude: notification.latitude,
        longitude: notification.longitude,
        heading: notification.heading,
        speed: notification.speed,
        eta: notification.eta,
        updatedAt: new Date().toISOString()
      }
    });
  }

  static async publishPaymentConfirmationNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'PAYMENT_CONFIRMATION_NOTIFICATION',
      key: notification.userId.toString(),
      data: {
        notificationId: notification.id,
        type: 'PAYMENT_CONFIRMED',
        userId: notification.userId,
        tripId: notification.tripId,
        amount: notification.amount,
        paymentId: notification.paymentId,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishPayoutNotification(notification) {
    await eventBus.publish(KafkaConfig.topics.notificationEvents, {
      type: 'PAYOUT_NOTIFICATION',
      key: notification.driverId.toString(),
      data: {
        notificationId: notification.id,
        type: 'PAYOUT_COMPLETED',
        driverId: notification.driverId,
        tripId: notification.tripId,
        amount: notification.amount,
        payoutId: notification.payoutId,
        createdAt: new Date().toISOString()
      }
    });
  }
}

module.exports = NotificationPublisher;
