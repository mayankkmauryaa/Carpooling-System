const eventBus = require('../eventBus');
const { prisma } = require('../../database/connection');
const emailService = require('../../services/emailService');
const { socketManager } = require('../../socket/socketManager');
const pushNotificationService = require('../../services/PushNotificationService');
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

      const { userId, type, title, message, data, fcmToken } = event;

      socketManager.emitToUser(userId, 'notification', {
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString()
      });

      if (title && message) {
        if (fcmToken) {
          await pushNotificationService.sendToToken(fcmToken, {
            title,
            body: message,
            data: data || {}
          });
        } else if (userId) {
          await pushNotificationService.sendToUser(userId, {
            title,
            body: message,
            data: data || {}
          });
        }
      }

      logger.info('Real-time and push notification sent', { userId, type });
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
      logger.info('Processing notification.sendPush event', { 
        userId: event.userId, 
        fcmToken: !!event.fcmToken,
        type: event.type 
      });

      const { userId, fcmToken, title, message, data, type } = event;

      if (fcmToken && title && message) {
        const result = await pushNotificationService.sendToToken(fcmToken, {
          title,
          body: message,
          data: data || {}
        });

        if (result.success) {
          logger.info('Push notification sent successfully', { 
            userId, 
            type,
            messageId: result.messageId 
          });
        } else if (result.shouldRemove) {
          logger.warn('Invalid FCM token, removing', { userId });
          await pushNotificationService.removeInvalidToken(userId, fcmToken);
        } else {
          logger.warn('Push notification failed', { 
            userId, 
            type,
            error: result.error 
          });
        }
      } else if (userId && title && message) {
        const result = await pushNotificationService.sendToUser(userId, {
          title,
          body: message,
          data: data || {}
        });

        logger.info('Push notification sent to user devices', { 
          userId, 
          type,
          sent: result.sent || 0
        });
      } else {
        logger.warn('Push notification missing required fields', { 
          userId: !!userId, 
          fcmToken: !!fcmToken,
          title: !!title,
          message: !!message
        });
      }
    } catch (error) {
      logger.error('Error processing notification.sendPush', { error: error.message, event });
    }
  }
}

module.exports = new NotificationConsumer();
