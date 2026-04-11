const eventBus = require('../eventBus');
const { prisma } = require('../../database/connection');
const emailService = require('../../services/emailService');
const logger = require('../../middleware/logger');

class TripConsumer {
  constructor() {
    this.setup();
  }

  setup() {
    eventBus.on('trip.created', this.handleTripCreated.bind(this));
    eventBus.on('trip.started', this.handleTripStarted.bind(this));
    eventBus.on('trip.completed', this.handleTripCompleted.bind(this));
    eventBus.on('trip.cancelled', this.handleTripCancelled.bind(this));
    eventBus.on('booking.created', this.handleBookingCreated.bind(this));
    eventBus.on('booking.cancelled', this.handleBookingCancelled.bind(this));
    eventBus.on('seat.reserved', this.handleSeatReserved.bind(this));
    eventBus.on('seat.released', this.handleSeatReleased.bind(this));

    logger.info('TripConsumer initialized and listening for events');
  }

  async handleTripCreated(event) {
    try {
      logger.info('Processing trip.created event', { tripId: event.tripId });

      const trip = await prisma.trip.findUnique({
        where: { id: event.tripId },
        include: {
          ridePool: true,
          riders: true
        }
      });

      if (trip) {
        await this.updateAnalytics('trip_created');
        
        for (const rider of trip.riders) {
          eventBus.emit('notification.send', {
            userId: rider.id,
            type: 'TRIP_CONFIRMED',
            title: 'Trip Confirmed',
            message: `Your trip from ${trip.ridePool.pickupLocation} to ${trip.ridePool.dropLocation} has been confirmed.`,
            data: { tripId: trip.id }
          });
        }
      }
    } catch (error) {
      logger.error('Error processing trip.created', { error: error.message, event });
    }
  }

  async handleTripStarted(event) {
    try {
      logger.info('Processing trip.started event', { tripId: event.tripId });

      const trip = await prisma.trip.findUnique({
        where: { id: event.tripId },
        include: {
          ridePool: true,
          riders: true
        }
      });

      if (trip) {
        await prisma.trip.update({
          where: { id: event.tripId },
          data: {
            status: 'IN_PROGRESS',
            startTime: new Date()
          }
        });

        for (const rider of trip.riders) {
          eventBus.emit('notification.send', {
            userId: rider.id,
            type: 'TRIP_STARTED',
            title: 'Trip Started',
            message: 'Your ride has started. Track your driver in real-time.',
            data: { tripId: trip.id }
          });
        }

        eventBus.emit('driver.location.start_tracking', {
          driverId: trip.driverId,
          tripId: trip.id
        });
      }
    } catch (error) {
      logger.error('Error processing trip.started', { error: error.message, event });
    }
  }

  async handleTripCompleted(event) {
    try {
      logger.info('Processing trip.completed event', { tripId: event.tripId });

      const trip = await prisma.trip.findUnique({
        where: { id: event.tripId },
        include: {
          ridePool: true,
          riders: true,
          driver: true
        }
      });

      if (trip) {
        await prisma.trip.update({
          where: { id: event.tripId },
          data: {
            status: 'COMPLETED',
            endTime: new Date()
          }
        });

        await this.updateAnalytics('trip_completed', {
          distance: trip.actualDistance,
          duration: trip.actualDuration,
          earnings: trip.totalFare
        });

        eventBus.emit('payout.calculate', {
          tripId: trip.id,
          driverId: trip.driverId
        });

        for (const rider of trip.riders) {
          eventBus.emit('notification.send', {
            userId: rider.id,
            type: 'TRIP_COMPLETED',
            title: 'Trip Completed',
            message: 'Your trip has been completed. Please rate your experience.',
            data: { tripId: trip.id, tripEnded: true }
          });

          eventBus.emit('review.reminder', {
            userId: rider.id,
            tripId: trip.id,
            driverId: trip.driverId
          });
        }

        eventBus.emit('driver.location.stop_tracking', {
          driverId: trip.driverId
        });
      }
    } catch (error) {
      logger.error('Error processing trip.completed', { error: error.message, event });
    }
  }

  async handleTripCancelled(event) {
    try {
      logger.info('Processing trip.cancelled event', { tripId: event.tripId });

      const trip = await prisma.trip.findUnique({
        where: { id: event.tripId },
        include: { riders: true }
      });

      if (trip) {
        await prisma.trip.update({
          where: { id: event.tripId },
          data: { status: 'CANCELLED' }
        });

        for (const rider of trip.riders) {
          eventBus.emit('notification.send', {
            userId: rider.id,
            type: 'TRIP_CANCELLED',
            title: 'Trip Cancelled',
            message: `Your trip has been cancelled. ${event.reason || ''}`,
            data: { tripId: trip.id }
          });
        }
      }
    } catch (error) {
      logger.error('Error processing trip.cancelled', { error: error.message, event });
    }
  }

  async handleBookingCreated(event) {
    try {
      logger.info('Processing booking.created event', { bookingId: event.bookingId });

      eventBus.emit('payment.initiate', {
        bookingId: event.bookingId,
        amount: event.amount,
        userId: event.userId
      });
    } catch (error) {
      logger.error('Error processing booking.created', { error: error.message, event });
    }
  }

  async handleBookingCancelled(event) {
    try {
      logger.info('Processing booking.cancelled event', { bookingId: event.bookingId });

      eventBus.emit('refund.process', {
        bookingId: event.bookingId,
        userId: event.userId,
        reason: event.reason
      });
    } catch (error) {
      logger.error('Error processing booking.cancelled', { error: error.message, event });
    }
  }

  async handleSeatReserved(event) {
    try {
      logger.info('Processing seat.reserved event', { ridePoolId: event.ridePoolId });

      await prisma.ridePool.update({
        where: { id: event.ridePoolId },
        data: {
          availableSeats: { decrement: event.seats },
          bookedSeats: { increment: event.seats }
        }
      });
    } catch (error) {
      logger.error('Error processing seat.reserved', { error: error.message, event });
    }
  }

  async handleSeatReleased(event) {
    try {
      logger.info('Processing seat.released event', { ridePoolId: event.ridePoolId });

      await prisma.ridePool.update({
        where: { id: event.ridePoolId },
        data: {
          availableSeats: { increment: event.seats },
          bookedSeats: { decrement: event.seats }
        }
      });
    } catch (error) {
      logger.error('Error processing seat.released', { error: error.message, event });
    }
  }

  async updateAnalytics(type, data = {}) {
    logger.info('Analytics updated', { type, data });
  }
}

module.exports = new TripConsumer();
