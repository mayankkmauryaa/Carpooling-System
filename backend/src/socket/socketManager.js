const { Server } = require('socket.io');
const http = require('http');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../database/redis');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const logger = require('../middleware/logger');

class SocketManager {
  constructor() {
    this.io = null;
    this.namespaces = {
      rides: null,
      users: null,
      notifications: null,
      chat: null
    };
    this.connectedUsers = new Map();
    this.driverLocations = new Map();
    this.onlineDrivers = new Set();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupMiddlewares();
    this.initializeNamespaces();
    this.setupGlobalEvents();

    logger.info('Socket.IO server initialized');
    return this.io;
  }

  setupMiddlewares() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                      socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        if (!JWT_SECRET || JWT_SECRET === 'your-secret-key') {
          return next(new Error('JWT_SECRET not configured'));
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  initializeNamespaces() {
    this.namespaces.rides = this.io.of('/rides');
    this.namespaces.users = this.io.of('/users');
    this.namespaces.notifications = this.io.of('/notifications');
    this.namespaces.chat = this.io.of('/chat');

    this.setupRidesNamespace();
    this.setupUsersNamespace();
    this.setupNotificationsNamespace();
    this.setupChatNamespace();
  }

  setupRidesNamespace() {
    const rides = this.namespaces.rides;

    rides.on('connection', (socket) => {
      logger.info('Socket connected', { namespace: '/rides', userId: socket.user.id });

      socket.on('joinRide', async (rideId) => {
        const room = `ride_${rideId}`;
        socket.join(room);
        socket.currentRide = rideId;
        
        const rideData = await this.getCachedRide(rideId);
        if (rideData) {
          socket.emit('rideData', rideData);
        }

        socket.to(room).emit('userJoined', {
          userId: socket.user.id,
          timestamp: new Date()
        });
      });

      socket.on('leaveRide', (rideId) => {
        const room = `ride_${rideId}`;
        socket.leave(room);
        socket.to(room).emit('userLeft', {
          userId: socket.user.id,
          timestamp: new Date()
        });
      });

      socket.on('updateLocation', async (data) => {
        const { rideId, lat, lng, heading, speed } = data;
        
        this.driverLocations.set(socket.user.id, { lat, lng, heading, speed, timestamp: Date.now() });
        
        if (rideId) {
          const room = `ride_${rideId}`;
          const locationData = {
            driverId: socket.user.id,
            lat,
            lng,
            heading,
            speed,
            timestamp: Date.now()
          };

          await this.cacheDriverLocation(rideId, socket.user.id, locationData);
          
          socket.to(room).emit('driverLocationUpdated', locationData);
        }
      });

      socket.on('updateRideStatus', async (data) => {
        const { rideId, status, eta, distance } = data;
        const room = `ride_${rideId}`;

        socket.to(room).emit('rideStatusChanged', {
          rideId,
          status,
          eta,
          distance,
          updatedBy: socket.user.id,
          timestamp: new Date()
        });
      });

      socket.on('requestETA', async (data) => {
        const { rideId, destinationLat, destinationLng } = data;
        
        const driverLocation = this.driverLocations.get(socket.user.id);
        if (driverLocation) {
          socket.emit('etaCalculated', {
            driverLat: driverLocation.lat,
            driverLng: driverLocation.lng,
            destinationLat,
            destinationLng,
            estimatedTime: this.calculateETA(driverLocation.lat, driverLocation.lng, destinationLat, destinationLng)
          });
        }
      });

      socket.on('disconnect', () => {
        if (socket.currentRide) {
          const room = `ride_${socket.currentRide}`;
          socket.to(room).emit('userLeft', {
            userId: socket.user.id,
            timestamp: new Date()
          });
        }
        this.driverLocations.delete(socket.user.id);
        this.onlineDrivers.delete(socket.user.id);
      });
    });
  }

  setupUsersNamespace() {
    const users = this.namespaces.users;

    users.on('connection', (socket) => {
      logger.info('Socket connected', { namespace: '/users', userId: socket.user.id });
      
      this.connectedUsers.set(socket.user.id, socket.id);

      socket.on('goOnline', () => {
        if (socket.user.role === 'DRIVER') {
          this.onlineDrivers.add(socket.user.id);
          this.io.emit('driverStatusChanged', {
            driverId: socket.user.id,
            online: true
          });
        }
      });

      socket.on('goOffline', () => {
        this.connectedUsers.delete(socket.user.id);
        this.onlineDrivers.delete(socket.user.id);
        this.io.emit('driverStatusChanged', {
          driverId: socket.user.id,
          online: false
        });
      });

      socket.on('getOnlineDrivers', () => {
        const drivers = Array.from(this.onlineDrivers);
        socket.emit('onlineDriversList', { drivers });
      });

      socket.on('sendToUser', (data) => {
        const { targetUserId, event, payload } = data;
        const targetSocketId = this.connectedUsers.get(targetUserId);
        
        if (targetSocketId) {
          this.io.to(targetSocketId).emit(event, {
            ...payload,
            from: socket.user.id
          });
        }
      });

      socket.on('disconnect', () => {
        this.connectedUsers.delete(socket.user.id);
        this.onlineDrivers.delete(socket.user.id);
      });
    });
  }

  setupNotificationsNamespace() {
    const notifications = this.namespaces.notifications;

    notifications.on('connection', (socket) => {
      logger.info('Socket connected', { namespace: '/notifications', userId: socket.user.id });

      socket.on('subscribe', (channel) => {
        socket.join(`notification_${channel}`);
      });

      socket.on('unsubscribe', (channel) => {
        socket.leave(`notification_${channel}`);
      });

      socket.on('markAsRead', async (notificationId) => {
        socket.emit('notificationRead', { notificationId });
      });
    });
  }

  setupChatNamespace() {
    const chat = this.namespaces.chat;

    chat.on('connection', (socket) => {
      logger.info('Socket connected', { namespace: '/chat', userId: socket.user.id });

      socket.on('joinConversation', (conversationId) => {
        const room = `conversation_${conversationId}`;
        socket.join(room);
        socket.currentConversation = conversationId;
      });

      socket.on('leaveConversation', (conversationId) => {
        const room = `conversation_${conversationId}`;
        socket.leave(room);
      });

      socket.on('sendMessage', async (data) => {
        const { conversationId, message, type } = data;
        const room = `conversation_${conversationId}`;

        const messageData = {
          id: Date.now().toString(),
          conversationId,
          senderId: socket.user.id,
          message,
          type: type || 'text',
          timestamp: new Date()
        };

        socket.to(room).emit('newMessage', messageData);
        socket.emit('messageSent', messageData);
      });

      socket.on('typing', (conversationId) => {
        const room = `conversation_${conversationId}`;
        socket.to(room).emit('userTyping', {
          userId: socket.user.id,
          conversationId
        });
      });

      socket.on('stopTyping', (conversationId) => {
        const room = `conversation_${conversationId}`;
        socket.to(room).emit('userStoppedTyping', {
          userId: socket.user.id,
          conversationId
        });
      });

      socket.on('markMessagesRead', async (data) => {
        const { conversationId, messageIds } = data;
        const room = `conversation_${conversationId}`;
        
        socket.to(room).emit('messagesRead', {
          readerId: socket.user.id,
          messageIds,
          conversationId
        });
      });

      socket.on('disconnect', () => {
        if (socket.currentConversation) {
          const room = `conversation_${socket.currentConversation}`;
          socket.to(room).emit('userLeft', {
            userId: socket.user.id
          });
        }
      });
    });
  }

  setupGlobalEvents() {
    this.io.on('connection', (socket) => {
      logger.info('Socket connected', { namespace: 'global', userId: socket.user?.id });
    });
  }

  async getCachedRide(rideId) {
    try {
      const redis = getRedisClient();
      if (redis) {
        const data = await redis.get(`ride:${rideId}`);
        return data ? JSON.parse(data) : null;
      }
    } catch (error) {
      logger.error('Redis getCachedRide error', { error: error.message, rideId });
    }
    return null;
  }

  async cacheDriverLocation(rideId, driverId, location) {
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.setex(
          `driverLocation:${rideId}:${driverId}`,
          300,
          JSON.stringify(location)
        );
      }
    } catch (error) {
      logger.error('Redis cacheDriverLocation error', { error: error.message, rideId, driverId });
    }
  }

  calculateETA(lat1, lng1, lat2, lng2, avgSpeedKmh = 40) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    const timeHours = distance / avgSpeedKmh;
    return Math.round(timeHours * 60);
  }

  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToRide(rideId, event, data) {
    this.io.to(`ride_${rideId}`).emit(event, data);
  }

  emitToConversation(conversationId, event, data) {
    this.io.to(`conversation_${conversationId}`).emit(event, data);
  }

  emitNotification(userId, notification) {
    this.io.of('/notifications').to(`notification_${userId}`).emit('newNotification', notification);
  }

  broadcastDriverLocation(driverId, location) {
    this.io.of('/rides').emit('driverLocationUpdate', {
      driverId,
      ...location
    });
  }
}

const socketManager = new SocketManager();

module.exports = { socketManager, SocketManager };
