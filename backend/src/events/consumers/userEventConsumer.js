const eventBus = require('../eventBus');
const { prisma } = require('../../database/connection');
const emailService = require('../../services/emailService');
const { socketManager } = require('../../socket/socketManager');
const logger = require('../../middleware/logger');

class UserEventConsumer {
  constructor() {
    this.setup();
  }

  setup() {
    eventBus.on('user.registered', this.handleUserRegistered.bind(this));
    eventBus.on('user.suspended', this.handleUserSuspended.bind(this));
    eventBus.on('user.unsuspended', this.handleUserUnsuspended.bind(this));
    eventBus.on('user.roleChanged', this.handleRoleChanged.bind(this));
    eventBus.on('user.emailVerified', this.handleEmailVerified.bind(this));

    logger.info('UserEventConsumer initialized and listening for events');
  }

  async handleUserRegistered(event) {
    try {
      logger.info('Processing user.registered event', { userId: event.userId, email: event.email });

      await emailService.sendEmail({
        to: event.email,
        subject: 'Welcome to Carpooling System!',
        template: 'welcome',
        context: {
          firstName: event.firstName,
          email: event.email
        }
      });

      eventBus.emit('notification.send', {
        userId: event.userId,
        type: 'WELCOME',
        title: 'Welcome to Carpooling!',
        message: 'Thank you for registering. Start by adding your profile and vehicle details.',
        data: { userId: event.userId }
      });

      logger.info('User registered event processed', { userId: event.userId });
    } catch (error) {
      logger.error('Error processing user.registered', { error: error.message, event });
    }
  }

  async handleUserSuspended(event) {
    try {
      logger.info('Processing user.suspended event', { userId: event.userId, reason: event.reason });

      const user = await prisma.user.findUnique({
        where: { id: event.userId }
      });

      if (user) {
        socketManager.emitToUser(event.userId, 'account_suspended', {
          reason: event.reason,
          suspendedAt: new Date().toISOString()
        });

        await emailService.sendEmail({
          to: user.email,
          subject: 'Account Suspended - Carpooling System',
          html: `
            <h1>Account Suspended</h1>
            <p>Dear ${user.firstName},</p>
            <p>Your account has been suspended for the following reason:</p>
            <p><strong>${event.reason || 'Policy violation'}</strong></p>
            <p>If you believe this is a mistake, please contact our support team.</p>
          `
        });

        eventBus.emit('notification.send', {
          userId: event.userId,
          type: 'ACCOUNT_SUSPENDED',
          title: 'Account Suspended',
          message: `Your account has been suspended. Reason: ${event.reason || 'Policy violation'}`,
          data: { reason: event.reason }
        });
      }

      logger.info('User suspended event processed', { userId: event.userId });
    } catch (error) {
      logger.error('Error processing user.suspended', { error: error.message, event });
    }
  }

  async handleUserUnsuspended(event) {
    try {
      logger.info('Processing user.unsuspended event', { userId: event.userId });

      const user = await prisma.user.findUnique({
        where: { id: event.userId }
      });

      if (user) {
        socketManager.emitToUser(event.userId, 'account_unsuspended', {
          unsuspendedAt: new Date().toISOString()
        });

        await emailService.sendEmail({
          to: user.email,
          subject: 'Account Reactivated - Carpooling System',
          html: `
            <h1>Account Reactivated</h1>
            <p>Dear ${user.firstName},</p>
            <p>Great news! Your account has been reactivated.</p>
            <p>You can now log in and continue using our services.</p>
          `
        });

        eventBus.emit('notification.send', {
          userId: event.userId,
          type: 'ACCOUNT_REACTIVATED',
          title: 'Account Reactivated',
          message: 'Your account has been reactivated. Welcome back!',
          data: {}
        });
      }

      logger.info('User unsuspended event processed', { userId: event.userId });
    } catch (error) {
      logger.error('Error processing user.unsuspended', { error: error.message, event });
    }
  }

  async handleRoleChanged(event) {
    try {
      logger.info('Processing user.roleChanged event', { userId: event.userId, newRole: event.newRole });

      const user = await prisma.user.findUnique({
        where: { id: event.userId }
      });

      if (user) {
        socketManager.emitToUser(event.userId, 'role_changed', {
          oldRole: event.oldRole,
          newRole: event.newRole,
          changedAt: new Date().toISOString()
        });

        eventBus.emit('notification.send', {
          userId: event.userId,
          type: 'ROLE_CHANGED',
          title: 'Role Updated',
          message: `Your account role has been updated to ${event.newRole}`,
          data: { oldRole: event.oldRole, newRole: event.newRole }
        });
      }

      logger.info('User role changed event processed', { userId: event.userId, newRole: event.newRole });
    } catch (error) {
      logger.error('Error processing user.roleChanged', { error: error.message, event });
    }
  }

  async handleEmailVerified(event) {
    try {
      logger.info('Processing user.emailVerified event', { userId: event.userId });

      const user = await prisma.user.findUnique({
        where: { id: event.userId }
      });

      if (user) {
        socketManager.emitToUser(event.userId, 'email_verified', {
          verifiedAt: new Date().toISOString()
        });

        await emailService.sendEmail({
          to: user.email,
          subject: 'Email Verified - Carpooling System',
          html: `
            <h1>Email Verified</h1>
            <p>Dear ${user.firstName},</p>
            <p>Your email has been successfully verified!</p>
            <p>You now have full access to all features of Carpooling System.</p>
          `
        });

        eventBus.emit('notification.send', {
          userId: event.userId,
          type: 'EMAIL_VERIFIED',
          title: 'Email Verified',
          message: 'Your email has been verified successfully!',
          data: {}
        });
      }

      logger.info('User email verified event processed', { userId: event.userId });
    } catch (error) {
      logger.error('Error processing user.emailVerified', { error: error.message, event });
    }
  }
}

module.exports = new UserEventConsumer();
