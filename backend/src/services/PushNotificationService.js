const { PrismaClient } = require('@prisma/client');
const logger = require('../middleware/logger');

const prisma = new PrismaClient();

class PushNotificationService {
  constructor() {
    this.firebaseAdmin = null;
    this.isInitialized = false;
  }

  async initializeFirebase() {
    if (this.isInitialized) return;

    try {
      const admin = require('firebase-admin');
      
      if (!admin.apps.length) {
        const serviceAccount = {
          projectId: process.env.FCM_PROJECT_ID,
          privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FCM_CLIENT_EMAIL
        };

        if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          this.firebaseAdmin = admin;
          this.isInitialized = true;
          logger.info('Firebase Admin initialized successfully');
        } else {
          logger.warn('FCM credentials not configured - push notifications disabled');
        }
      } else {
        this.firebaseAdmin = admin;
        this.isInitialized = true;
      }
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin', { error: error.message });
      this.isInitialized = false;
    }
  }

  async sendToToken(token, payload) {
    if (!this.isInitialized) {
      await this.initializeFirebase();
    }

    if (!this.isInitialized || !token) {
      logger.warn('FCM not initialized or token missing', { hasToken: !!token });
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'carpooling_notifications',
            channelName: 'Carpooling Notifications',
            channelDescription: 'Notifications for bookings and trips'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          },
          headers: {
            'apns-priority': '10'
          }
        }
      };

      if (payload.sound) {
        message.android.notification.sound = payload.sound;
        message.apns.payload.aps.sound = payload.sound;
      }

      const response = await this.firebaseAdmin.messaging().send(message);
      logger.info('Push notification sent', { token: token.substring(0, 20), messageId: response });
      
      return { success: true, messageId: response };
    } catch (error) {
      logger.error('Failed to send push notification', { 
        error: error.message, 
        token: token?.substring(0, 20) 
      });
      
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { success: false, error: 'invalid_token', shouldRemove: true };
      }
      
      return { success: false, error: error.message };
    }
  }

  async sendToUser(userId, payload) {
    try {
      const devices = await prisma.deviceToken.findMany({
        where: { userId, isActive: true },
        select: { token: true, fcmToken: true }
      });

      if (devices.length === 0) {
        logger.info('No device tokens found for user', { userId });
        return { success: true, sent: 0 };
      }

      const results = await Promise.allSettled(
        devices.map(device => this.sendToToken(device.fcmToken || device.token, payload))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
      const failed = results.filter(r => !r.value?.success).length;

      logger.info('Push notifications sent to user', { userId, total: devices.length, successful, failed });
      
      return { success: true, sent: successful, failed };
    } catch (error) {
      logger.error('Failed to send push to user', { error: error.message, userId });
      return { success: false, error: error.message };
    }
  }

  async sendToMultiple(tokens, payload) {
    const results = await Promise.allSettled(
      tokens.map(token => this.sendToToken(token, payload))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    
    return { success: true, sent: successful, total: tokens.length };
  }

  async sendToTopic(topic, payload) {
    if (!this.isInitialized) {
      await this.initializeFirebase();
    }

    if (!this.isInitialized) {
      return { success: false, error: 'FCM not configured' };
    }

    try {
      const message = {
        topic: topic,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {}
      };

      const response = await this.firebaseAdmin.messaging().send(message);
      logger.info('Push notification sent to topic', { topic, messageId: response });
      
      return { success: true, messageId: response };
    } catch (error) {
      logger.error('Failed to send push to topic', { error: error.message, topic });
      return { success: false, error: error.message };
    }
  }

  async removeInvalidToken(userId, token) {
    try {
      await prisma.deviceToken.deleteMany({
        where: { userId, token }
      });
      logger.info('Invalid token removed', { userId });
    } catch (error) {
      logger.error('Failed to remove token', { error: error.message });
    }
  }
}

module.exports = new PushNotificationService();