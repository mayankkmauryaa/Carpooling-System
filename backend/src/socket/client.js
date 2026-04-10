class SocketClient {
  constructor() {
    this.socket = null;
    this.namespaces = {
      rides: null,
      users: null,
      notifications: null,
      chat: null
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventHandlers = new Map();
  }

  connect(token, options = {}) {
    const { 
      namespace = 'rides',
      transports = ['websocket', 'polling'],
      reconnection = true,
      reconnectionAttempts = 5,
      reconnectionDelay = 1000
    } = options;

    const socketUrl = process.env.SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(socketUrl, {
      auth: { token },
      transports,
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    this.setupGlobalListeners();
    return this;
  }

  connectToNamespace(namespace, token) {
    const socketUrl = process.env.SOCKET_URL || 'http://localhost:5000';
    this.namespaces[namespace] = io(`${socketUrl}/${namespace}`, {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    return this.namespaces[namespace];
  }

  setupGlobalListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.reconnectAttempts = 0;
      this.emit('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      this.reconnectAttempts++;
      this.emit('connectionError', { 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', { attemptNumber });
    });
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
    this.socket?.on(event, handler);
    return this;
  }

  off(event, handler) {
    if (handler) {
      this.socket?.off(event, handler);
    } else {
      this.socket?.off(event);
    }
    return this;
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    Object.values(this.namespaces).forEach(ns => {
      if (ns) ns.disconnect();
    });
    this.namespaces = { rides: null, users: null, notifications: null, chat: null };
  }

  getRidesNamespace() {
    return this.namespaces.rides;
  }

  getUsersNamespace() {
    return this.namespaces.users;
  }

  getNotificationsNamespace() {
    return this.namespaces.notifications;
  }

  getChatNamespace() {
    return this.namespaces.chat;
  }
}

class RidesSocket {
  constructor(namespace) {
    this.namespace = namespace;
  }

  joinRide(rideId) {
    this.namespace.emit('joinRide', rideId);
  }

  leaveRide(rideId) {
    this.namespace.emit('leaveRide', rideId);
  }

  updateLocation(rideId, location) {
    this.namespace.emit('updateLocation', { rideId, ...location });
  }

  updateRideStatus(rideId, status, eta, distance) {
    this.namespace.emit('updateRideStatus', { rideId, status, eta, distance });
  }

  requestETA(rideId, destinationLat, destinationLng) {
    this.namespace.emit('requestETA', { rideId, destinationLat, destinationLng });
  }

  onDriverLocationUpdated(handler) {
    this.namespace.on('driverLocationUpdated', handler);
  }

  onRideStatusChanged(handler) {
    this.namespace.on('rideStatusChanged', handler);
  }

  onRideData(handler) {
    this.namespace.on('rideData', handler);
  }

  onUserJoined(handler) {
    this.namespace.on('userJoined', handler);
  }

  onUserLeft(handler) {
    this.namespace.on('userLeft', handler);
  }

  onETACalculated(handler) {
    this.namespace.on('etaCalculated', handler);
  }
}

class ChatSocket {
  constructor(namespace) {
    this.namespace = namespace;
  }

  joinConversation(conversationId) {
    this.namespace.emit('joinConversation', conversationId);
  }

  leaveConversation(conversationId) {
    this.namespace.emit('leaveConversation', conversationId);
  }

  sendMessage(conversationId, message, type = 'text') {
    this.namespace.emit('sendMessage', { conversationId, message, type });
  }

  startTyping(conversationId) {
    this.namespace.emit('typing', conversationId);
  }

  stopTyping(conversationId) {
    this.namespace.emit('stopTyping', conversationId);
  }

  markMessagesRead(conversationId, messageIds) {
    this.namespace.emit('markMessagesRead', { conversationId, messageIds });
  }

  onNewMessage(handler) {
    this.namespace.on('newMessage', handler);
  }

  onMessageSent(handler) {
    this.namespace.on('messageSent', handler);
  }

  onUserTyping(handler) {
    this.namespace.on('userTyping', handler);
  }

  onUserStoppedTyping(handler) {
    this.namespace.on('userStoppedTyping', handler);
  }

  onMessagesRead(handler) {
    this.namespace.on('messagesRead', handler);
  }
}

class NotificationsSocket {
  constructor(namespace) {
    this.namespace = namespace;
  }

  subscribe(channel) {
    this.namespace.emit('subscribe', channel);
  }

  unsubscribe(channel) {
    this.namespace.emit('unsubscribe', channel);
  }

  markAsRead(notificationId) {
    this.namespace.emit('markAsRead', notificationId);
  }

  onNewNotification(handler) {
    this.namespace.on('newNotification', handler);
  }

  onNotificationRead(handler) {
    this.namespace.on('notificationRead', handler);
  }
}

class UsersSocket {
  constructor(namespace) {
    this.namespace = namespace;
  }

  goOnline() {
    this.namespace.emit('goOnline');
  }

  goOffline() {
    this.namespace.emit('goOffline');
  }

  getOnlineDrivers() {
    this.namespace.emit('getOnlineDrivers');
  }

  sendToUser(targetUserId, event, payload) {
    this.namespace.emit('sendToUser', { targetUserId, event, payload });
  }

  onOnlineDriversList(handler) {
    this.namespace.on('onlineDriversList', handler);
  }

  onDriverStatusChanged(handler) {
    this.namespace.on('driverStatusChanged', handler);
  }
}

module.exports = {
  SocketClient,
  RidesSocket,
  ChatSocket,
  NotificationsSocket,
  UsersSocket
};
