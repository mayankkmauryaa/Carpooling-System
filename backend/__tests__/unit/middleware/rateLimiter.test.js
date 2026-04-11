const RateLimiter = require('../../../src/middleware/rateLimiter');

describe('RateLimiter', () => {
  let rateLimiter;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000,
      max: 100,
      message: 'Too many requests'
    });

    mockReq = {
      ip: '192.168.1.1',
      path: '/api/test',
      user: null
    };

    mockRes = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('getKey', () => {
    it('should return IP-based key for unauthenticated requests', () => {
      const key = rateLimiter.getKey(mockReq);
      expect(key).toBe('ip:192.168.1.1');
    });

    it('should return user-based key for authenticated requests', () => {
      mockReq.user = { id: 123 };
      const key = rateLimiter.getKey(mockReq);
      expect(key).toBe('user:123');
    });

    it('should handle X-Forwarded-For header', () => {
      mockReq.ip = undefined;
      mockReq.headers = { 'x-forwarded-for': '10.0.0.1' };
      const key = rateLimiter.getKey(mockReq);
      expect(key).toBe('ip:10.0.0.1');
    });
  });

  describe('check', () => {
    it('should allow first request within limit', async () => {
      await rateLimiter.check(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should set rate limit headers', async () => {
      await rateLimiter.check(mockReq, mockRes, mockNext);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 100);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
    });

    it('should block requests exceeding limit', async () => {
      for (let i = 0; i < 100; i++) {
        await rateLimiter.check(mockReq, mockRes, mockNext);
      }

      mockNext.mockClear();
      await rateLimiter.check(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Too many requests',
        retryAfter: expect.any(Number)
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should track requests per IP separately', async () => {
      await rateLimiter.check(mockReq, mockRes, mockNext);

      const req2 = { ...mockReq, ip: '192.168.1.2' };
      await rateLimiter.check(req2, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove expired entries', async () => {
      await rateLimiter.check(mockReq, mockRes, mockNext);
      
      const shortLimiter = new RateLimiter({
        windowMs: 1,
        max: 100
      });

      await new Promise(resolve => setTimeout(resolve, 10));
      shortLimiter.cleanupOldEntries();

      const shortReq = { ip: '192.168.1.1', path: '/api/test' };
      await shortLimiter.check(shortReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should clear all rate limit data', async () => {
      await rateLimiter.check(mockReq, mockRes, mockNext);
      rateLimiter.reset();

      await rateLimiter.check(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return current statistics', async () => {
      await rateLimiter.check(mockReq, mockRes, mockNext);
      const stats = rateLimiter.getStats();

      expect(stats).toHaveEqualShape({
        totalKeys: expect.any(Number),
        hitCount: expect.any(Number)
      });
    });
  });
});
