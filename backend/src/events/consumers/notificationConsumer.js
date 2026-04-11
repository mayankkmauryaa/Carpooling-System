const eventBus = require('../eventBus');
const { prisma } = require('../../database/connection');
const emailService = require('../../services/emailService');
const { socketManager } = require('../../socket/socketManager');
const logger = require('../../middleware/logger');

class NotificationConsumer {
  constructor() {
    this.setup();
  }

  setup() {
    eventBus.on('notification.send', this.handleSendNotification.bind(this));
    eventBus.on('notification.sendEmail', this.handleSendEmail.bind(this));
    eventBus.on('notification.sendSMS', this.handleSendSMS.bind(this));
    eventBus.on('notification.sendPush', this.handleSendPush.bind(this));

    logger.info('NotificationConsumer initialized and listening for events');
  }

  async handleSendNotification(event) {
    try {
      logger.info('Processing notification.send event', { userId: event.userId, type: event.type });

      const { userId, type, title, message, data } = event;

      socketManager.emitToUser(userId, 'notification', {
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      logger.info('Real-time notification sent', { userId, type });
    } catch (error) {
      logger.error('Error processing notification.send', { error: error.message, event });
    }
  }

  async handleSendEmail(event) {
    try {
      logger.info('Processing notification.sendEmail event', { email: event.email, type: event.type });

      const { email, subject, template, context } = event;

      if (template) {
        await emailService.sendEmail({
          to: email,
          subject: subject || 'Notification from Carpooling System',
          template,
          context
        });
      } else {
        await emailService.sendEmail({
          to: email,
          subject: subject || 'Notification from Carpooling System',
          html: message || '<p>You have a new notification.</p>'
        });
      }

      logger.info('Email notification sent', { email, type: event.type });
    } catch (error) {
      logger.error('Error processing notification.sendEmail', { error: error.message, event });
    }
  }

  async handleSendSMS(event) {
    try {
      logger.info('Processing notification.sendSMS event', { phone: event.phone, type: event.type });

      // TODO [SMS]: Integrate with Twilio for SMS notifications
      // const twilio = require('twilio')(process.env.TWILIO_SMS_ACCOUNT_SID, process.env.TWILIO_SMS_AUTH_TOKEN);
      // await twilio.messages.create({
      //   body: event.message,
      //   from: process.env.TWILIO_SMS_FROM,
      //   to: event.phone
      // });

      logger.info('SMS notification queued (Twilio integration pending)', { phone: event.phone, type: event.type });
    } catch (error) {
      logger.error('Error processing notification.sendSMS', { error: error.message, event });
    }
  }

  async handleSendPush(event) {
    try {
      logger.info('Processing notification.sendPush event', { userId: event.userId, type: event.type });

      // TODO [Push]: Integrate with Firebase Cloud Messaging (FCM)
      // const admin = require('firebase-admin');
      // if (!admin.apps.length) {
      //   admin.initializeApp({
      //     credential: admin.credential.cert({
      //       projectId: process.env.FCM_PROJECT_ID,
      //       privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      //       clientEmail: process.env.FCM_CLIENT_EMAIL
      //     })
      //   });
      // }
      // await admin.messaging().send({
      //   token: event.fcmToken,
      //   notification: { title: event.title, body: event.message },
      //   data: event.data
      // });

      logger.info('Push notification queued (FCM integration pending)', { userId: event.userId, type: event.type });
    } catch (error) {
      logger.error('Error processing notification.sendPush', { error: error.message, event });
    }
  }
}

module.exports = new NotificationConsumer();
