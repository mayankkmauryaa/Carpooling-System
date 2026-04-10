const eventBus = require('./eventBus');
const KafkaConfig = require('../config/kafka');

class TripPublisher {
  static async publishTripCreated(trip) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'TRIP_CREATED',
      key: trip.id.toString(),
      data: {
        tripId: trip.id,
        ridePoolId: trip.ridePoolId,
        driverId: trip.driverId,
        riderIds: trip.riderIds,
        status: trip.status,
        scheduledTime: trip.scheduledTime,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishTripStarted(trip) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'TRIP_STARTED',
      key: trip.id.toString(),
      data: {
        tripId: trip.id,
        ridePoolId: trip.ridePoolId,
        driverId: trip.driverId,
        riderIds: trip.riderIds,
        startTime: trip.startTime,
        startLocation: trip.startLocation,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishTripCompleted(trip) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'TRIP_COMPLETED',
      key: trip.id.toString(),
      data: {
        tripId: trip.id,
        ridePoolId: trip.ridePoolId,
        driverId: trip.driverId,
        riderIds: trip.riderIds,
        startTime: trip.startTime,
        endTime: trip.endTime,
        totalFare: trip.totalFare,
        actualDistance: trip.actualDistance,
        actualDuration: trip.actualDuration,
        endLocation: trip.endLocation,
        completedAt: new Date().toISOString()
      }
    });
  }

  static async publishTripCancelled(trip, reason, cancelledBy) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'TRIP_CANCELLED',
      key: trip.id.toString(),
      data: {
        tripId: trip.id,
        ridePoolId: trip.ridePoolId,
        driverId: trip.driverId,
        riderIds: trip.riderIds,
        reason: reason,
        cancelledBy: cancelledBy,
        cancelledAt: new Date().toISOString()
      }
    });
  }

  static async publishRideRequestReceived(request) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'RIDE_REQUEST_RECEIVED',
      key: request.id.toString(),
      data: {
        requestId: request.id,
        ridePoolId: request.ridePoolId,
        riderId: request.riderId,
        pickupLocation: request.pickupLocation,
        dropLocation: request.dropLocation,
        requestedAt: request.requestedAt,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishRideRequestApproved(request) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'RIDE_REQUEST_APPROVED',
      key: request.id.toString(),
      data: {
        requestId: request.id,
        ridePoolId: request.ridePoolId,
        riderId: request.riderId,
        approvedAt: request.approvedAt,
        createdAt: new Date().toISOString()
      }
    });
  }

  static async publishRideRequestRejected(request) {
    await eventBus.publish(KafkaConfig.topics.tripEvents, {
      type: 'RIDE_REQUEST_REJECTED',
      key: request.id.toString(),
      data: {
        requestId: request.id,
        ridePoolId: request.ridePoolId,
        riderId: request.riderId,
        rejectionReason: request.rejectionReason,
        rejectedAt: request.rejectedAt,
        createdAt: new Date().toISOString()
      }
    });
  }
}

module.exports = TripPublisher;
