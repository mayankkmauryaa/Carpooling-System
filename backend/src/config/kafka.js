class KafkaConfig {
  static get isEnabled() {
    return process.env.KAFKA_ENABLED === 'true';
  }

  static get brokers() {
    return (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
  }

  static get clientId() {
    return process.env.KAFKA_CLIENT_ID || 'carpooling-system';
  }

  static get groupId() {
    return process.env.KAFKA_GROUP_ID || 'carpooling-group';
  }

  static get topics() {
    return {
      tripEvents: process.env.KAFKA_TOPIC_TRIP || 'trip-events',
      paymentEvents: process.env.KAFKA_TOPIC_PAYMENT || 'payment-events',
      notificationEvents: process.env.KAFKA_TOPIC_NOTIFICATION || 'notification-events',
      userEvents: process.env.KAFKA_TOPIC_USER || 'user-events'
    };
  }

  static get ssl() {
    return process.env.KAFKA_SSL === 'true';
  }

  static get sasl() {
    if (process.env.KAFKA_SASL_MECHANISM) {
      return {
        mechanism: process.env.KAFKA_SASL_MECHANISM,
        username: process.env.KAFKA_SASL_USERNAME,
        password: process.env.KAFKA_SASL_PASSWORD
      };
    }
    return null;
  }

  static get consumer() {
    return {
      sessionTimeout: parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT) || 30000,
      heartbeatInterval: parseInt(process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL) || 3000,
      maxWaitTimeInMs: parseInt(process.env.KAFKA_CONSUMER_MAX_WAIT) || 5000,
      autoCommit: process.env.KAFKA_AUTO_COMMIT === 'true',
      autoCommitInterval: parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL) || 5000
    };
  }

  static get producer() {
    return {
      acks: parseInt(process.env.KAFKA_PRODUCER_ACKS) || -1,
      timeout: parseInt(process.env.KAFKA_PRODUCER_TIMEOUT) || 30000,
      retries: parseInt(process.env.KAFKA_PRODUCER_RETRIES) || 3,
      retryDelay: parseInt(process.env.KAFKA_PRODUCER_RETRY_DELAY) || 100
    };
  }

  static getConnectionOptions() {
    const options = {
      clientId: this.clientId,
      brokers: this.brokers,
      ssl: this.ssl
    };

    if (this.sasl) {
      options.sasl = this.sasl;
    }

    return options;
  }
}

module.exports = KafkaConfig;
