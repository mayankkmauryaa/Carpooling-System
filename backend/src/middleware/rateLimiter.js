const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;
const MAX_ENTRIES_PER_LIMITER = 10000;
const CLEANUP_INTERVAL = 60 * 60 * 1000;

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || DEFAULT_WINDOW_MS;
    this.maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
    this.handler = options.handler || this.defaultHandler;
    this.name = options.name || 'default';
    this.store = new Map();
    this.cleanupInterval = null;
    
    this.startCleanup();
  }
  
  defaultHandler(req, res) {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
  }
  
  getKey(req) {
    return req.user ? req.user.id.toString() : req.ip;
  }
  
  startCleanup() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let deleted = 0;
      
      for (const [key, data] of this.store.entries()) {
        if (now > data.resetTime) {
          this.store.delete(key);
          deleted++;
        }
      }
      
      if (this.store.size > MAX_ENTRIES_PER_LIMITER) {
        const entries = Array.from(this.store.entries());
        entries.sort((a, b) => a[1].resetTime - b[1].resetTime);
        const toRemove = entries.slice(0, entries.length - MAX_ENTRIES_PER_LIMITER);
        toRemove.forEach(([key]) => this.store.delete(key));
        deleted += toRemove.length;
      }
      
      if (deleted > 0) {
        console.log(`RateLimiter [${this.name}]: Cleaned up ${deleted} entries`);
      }
    }, CLEANUP_INTERVAL);
  }
  
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      let record = this.store.get(key);
      
      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + this.windowMs
        };
        this.store.set(key, record);
      }
      
      record.count++;
      
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - record.count));
      res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
      
      if (record.count > this.maxRequests) {
        return this.handler(req, res);
      }
      
      next();
    };
  }
  
  reset(key) {
    this.store.delete(key);
  }
  
  getStatus(key) {
    const record = this.store.get(key);
    if (!record) return { remaining: this.maxRequests, reset: null };
    
    return {
      remaining: Math.max(0, this.maxRequests - record.count),
      reset: new Date(record.resetTime).toISOString()
    };
  }
}

const globalLimiter = new RateLimiter({
  name: 'global',
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Rate limit exceeded'
    });
  }
});

const authLimiter = new RateLimiter({
  name: 'auth',
  windowMs: 60 * 60 * 1000,
  maxRequests: 100,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts'
    });
  }
});

const searchLimiter = new RateLimiter({
  name: 'search',
  windowMs: 60 * 1000,
  maxRequests: 30,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many search requests'
    });
  }
});

module.exports = { RateLimiter, globalLimiter, authLimiter, searchLimiter };
