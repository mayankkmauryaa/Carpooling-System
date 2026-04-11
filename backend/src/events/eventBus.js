const EventEmitter = require('events');
const KafkaConfig = require('../config/kafka');
const logger = require('../middleware/logger');

const TOPICS = {
  TRIP_EVENTS: 'trip-events',
  PAYMENT_EVENTS: 'payment-events',
  NOTIFICATION_EVENTS: 'notification-events',
  USER_EVENTS: 'user-events'
};

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
    this.producer = null;
    this.isConnected = false;
    this.messageBuffer = [];
    this.maxBufferSize = 1000;
  }

  async initialize() {
    if (!KafkaConfig.isEnabled) {
      logger.info('EventBus: Kafka not enabled, using in-memory mode');
      return;
    }

    try {
      const { Kafka } = require('kafkajs');
      const kafka = new Kafka(KafkaConfig.getConnectionOptions());
      
      this.producer = kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000
      });

      await this.producer.connect();
      this.isConnected = true;
      
      logger.info('EventBus: Connected to Kafka');

      if (this.messageBuffer.length > 0) {
        await this.flushBuffer();
      }
    } catch (error) {
      logger.error('EventBus: Failed to connect to Kafka', { error: error.message });
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('EventBus: Disconnected from Kafka');
    }
  }

  async publish(topic, event) {
    const message = {
      key: event.key || String(Date.now()),
      value: JSON.stringify(event),
      headers: {
        timestamp: Date.now().toString(),
        eventType: event.type,
        version: '1.0'
      }
    };

    this.emitLocal(event.type, event);

    if (this.isConnected && this.producer) {
      try {
        await this.producer.send({
          topic,
          messages: [message]
        });
        logger.debug(`EventBus: Published to ${topic}`, { eventType: event.type });
      } catch (error) {
        logger.error(`EventBus: Failed to publish to ${topic}`, { error: error.message });
        this.bufferMessage(topic, message);
      }
    } else {
      this.bufferMessage(topic, message);
    }
  }

  bufferMessage(topic, message) {
    if (this.messageBuffer.length >= this.maxBufferSize) {
      this.messageBuffer.shift();
    }
    this.messageBuffer.push({ topic, message });
    logger.warn('EventBus: Message buffered due to Kafka unavailability', { 
      topic, 
      bufferSize: this.messageBuffer.length 
    });
  }

  async flushBuffer() {
    if (this.messageBuffer.length === 0) return;

    logger.info('EventBus: Flushing message buffer', { count: this.messageBuffer.length });

    const messages = [...this.messageBuffer];
    this.messageBuffer = [];

    for (const { topic, message } of messages) {
      try {
        await this.producer.send({
          topic,
          messages: [message]
        });
      } catch (error) {
        logger.error('EventBus: Failed to flush message', { topic, error: error.message });
        this.messageBuffer.push({ topic, message });
      }
    }
  }

  emitLocal(topic, event) {
    this.emit(event.type, event);
    this.emit('*', event);
  }

  emit(eventType, data) {
    super.emit(eventType, data);
    logger.debug(`EventBus: Emitted event ${eventType}`, { data });
  }

  async publishTripEvent(eventType, data) {
    return this.publish(TOPICS.TRIP_EVENTS, { type: eventType, ...data });
  }

  async publishPaymentEvent(eventType, data) {
    return this.publish(TOPICS.PAYMENT_EVENTS, { type: eventType, ...data });
  }

  async publishNotificationEvent(eventType, data) {
    return this.publish(TOPICS.NOTIFICATION_EVENTS, { type: eventType, ...data });
  }

  async publishUserEvent(eventType, data) {
    return this.publish(TOPICS.USER_EVENTS, { type: eventType, ...data });
  }

  getStats() {
    return {
      isConnected: this.isConnected,
      bufferSize: this.messageBuffer.length,
      listeners: this.listenerCount('*'),
      topics: TOPICS
    };
  }
}

const eventBus = new EventBus();

module.exports = eventBus;
module.exports.TOPICS = TOPICS;
