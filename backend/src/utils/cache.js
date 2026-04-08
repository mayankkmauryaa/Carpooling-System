let redis = null;
let useRedis = false;

const cache = new Map();
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

const initRedis = async () => {
  try {
    const redisModule = require('redis');
    redis = redisModule.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    redis.on('error', (err) => {
      console.log('Redis not available, using in-memory cache');
      useRedis = false;
    });
    
    await redis.connect();
    useRedis = true;
    console.log('Redis connected successfully');
    return true;
  } catch (error) {
    console.log('Redis not available, using in-memory cache');
    useRedis = false;
    return false;
  }
};

class CacheService {
  static async get(key) {
    if (useRedis && redis) {
      try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        return cache.get(key)?.value || null;
      }
    }
    
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  static async set(key, value, ttlSeconds = 300) {
    if (useRedis && redis) {
      try {
        await redis.set(key, JSON.stringify(value), {
          EX: ttlSeconds
        });
        return true;
      } catch (error) {
        cache.set(key, {
          value,
          expiry: Date.now() + ttlSeconds * 1000
        });
        return true;
      }
    }
    
    cache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000
    });
    
    return true;
  }
  
  static async del(key) {
    if (useRedis && redis) {
      try {
        await redis.del(key);
      } catch (error) {
        cache.delete(key);
      }
    } else {
      cache.delete(key);
    }
  }
  
  static async clear(pattern = '*') {
    if (useRedis && redis) {
      try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
        }
      } catch (error) {
        cache.clear();
      }
    } else {
      cache.clear();
    }
  }
  
  static async getStats() {
    if (useRedis && redis) {
      const info = await redis.info('memory');
      return {
        type: 'redis',
        memory: info
      };
    }
    
    return {
      type: 'memory',
      size: cache.size
    };
  }
  
  static cacheRide(rideId, rideData) {
    return this.set(`ride:${rideId}`, rideData, 300);
  }
  
  static getCachedRide(rideId) {
    return this.get(`ride:${rideId}`);
  }
  
  static cacheSearchResults(queryHash, results) {
    return this.set(`search:${queryHash}`, results, 60);
  }
  
  static getCachedSearchResults(queryHash) {
    return this.get(`search:${queryHash}`);
  }
  
  static cacheUser(userId, userData) {
    return this.set(`user:${userId}`, userData, 600);
  }
  
  static getCachedUser(userId) {
    return this.get(`user:${userId}`);
  }
  
  static invalidateUser(userId) {
    return this.del(`user:${userId}`);
  }
  
  static invalidateRide(rideId) {
    return this.del(`ride:${rideId}`);
  }
}

module.exports = { CacheService, initRedis };
