const rateLimit = new Map();

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || DEFAULT_WINDOW_MS;
    this.maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
    this.handler = options.handler || this.defaultHandler;
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
  
  cleanupOldEntries() {
    const now = Date.now();
    for (const [key, data] of rateLimit.entries()) {
      if (now > data.resetTime) {
        rateLimit.delete(key);
      }
    }
  }
  
  middleware() {
    return (req, res, next) => {
      const key = this.getKey(req);
      const now = Date.now();
      
      let record = rateLimit.get(key);
      
      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + this.windowMs
        };
        rateLimit.set(key, record);
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
    rateLimit.delete(key);
  }
  
  getStatus(key) {
    const record = rateLimit.get(key);
    if (!record) return { remaining: this.maxRequests, reset: null };
    
    return {
      remaining: Math.max(0, this.maxRequests - record.count),
      reset: new Date(record.resetTime).toISOString()
    };
  }
}

const globalLimiter = new RateLimiter({
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
