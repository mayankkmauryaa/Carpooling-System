const { getRedisClient, redisConnection } = require('../database/redis');
const { config } = require('../config');
const logger = require('../middleware/logger');

const memoryCache = new Map();

class CacheService {
  isRedisAvailable() {
    const redis = getRedisClient();
    return redis && redisConnection.isReady();
  }

  getFromMemory(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  setToMemory(key, value, ttlSeconds) {
    memoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
  }

  async get(key, ttlSeconds = config.CACHE_TTL) {
    if (this.isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        const value = await redis.get(key);
        if (value) return JSON.parse(value);
        return this.getFromMemory(key);
      } catch (error) {
        logger.warn(`Redis get error: ${error.message}`);
        return this.getFromMemory(key);
      }
    }
    return this.getFromMemory(key);
  }

  async set(key, value, ttlSeconds = config.CACHE_TTL) {
    if (this.isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return true;
      } catch (error) {
        logger.warn(`Redis set error: ${error.message}`);
        this.setToMemory(key, value, ttlSeconds);
        return true;
      }
    }
    this.setToMemory(key, value, ttlSeconds);
    return true;
  }

  async del(key) {
    if (this.isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        await redis.del(key);
      } catch (error) {
        logger.warn(`Redis delete error: ${error.message}`);
      }
    }
    memoryCache.delete(key);
  }

  async clear(pattern = '*') {
    if (this.isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        logger.warn(`Redis clear error: ${error.message}`);
      }
    }
    memoryCache.clear();
  }

  async getStats() {
    if (this.isRedisAvailable()) {
      try {
        const redis = getRedisClient();
        const info = await redis.info('memory');
        return { type: 'redis', memory: info };
      } catch (error) {
        return { type: 'memory', size: memoryCache.size };
      }
    }
    return { type: 'memory', size: memoryCache.size };
  }

  async user(userId, fetchFn) {
    const cached = await this.get(`user:${userId}`, config.CACHE_USER_TTL);
    if (cached) return cached;
    const data = await fetchFn();
    await this.set(`user:${userId}`, data, config.CACHE_USER_TTL);
    return data;
  }

  async ride(rideId, fetchFn) {
    const cached = await this.get(`ride:${rideId}`, config.CACHE_RIDE_TTL);
    if (cached) return cached;
    const data = await fetchFn();
    await this.set(`ride:${rideId}`, data, config.CACHE_RIDE_TTL);
    return data;
  }

  async search(queryHash, fetchFn) {
    const cached = await this.get(`search:${queryHash}`, config.CACHE_SEARCH_TTL);
    if (cached) return cached;
    const data = await fetchFn();
    await this.set(`search:${queryHash}`, data, config.CACHE_SEARCH_TTL);
    return data;
  }
}

module.exports = new CacheService();
