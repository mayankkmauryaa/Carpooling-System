const Redis = require('ioredis');
const config = require('../config/config');
const logger = require('../middleware/logger');

class RedisConnection {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.useRedis = false;
  }

  async connect() {
    if (this.isConnected && this.useRedis) {
      return this.client;
    }

    try {
      this.client = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        db: config.REDIS_DB,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis connection failed, using in-memory fallback');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
      });

      this.client.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        this.useRedis = true;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.warn(`Redis error: ${error.message}`);
        this.useRedis = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.useRedis = false;
        logger.warn('Redis connection closed');
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      logger.warn(`Redis not available, using in-memory cache: ${error.message}`);
      this.useRedis = false;
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      this.useRedis = false;
      logger.info('Redis disconnected gracefully');
    }
  }

  getClient() {
    return this.client;
  }

  isReady() {
    return this.useRedis && this.isConnected;
  }
}

const redisConnection = new RedisConnection();

const connectRedis = async () => {
  return await redisConnection.connect();
};

const disconnectRedis = async () => {
  return await redisConnection.disconnect();
};

const getRedisClient = () => {
  return redisConnection.getClient();
};

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  redisConnection
};
