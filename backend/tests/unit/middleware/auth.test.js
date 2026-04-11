const jwt = require('jsonwebtoken');
const { requireRole } = require('../../../src/middleware/auth');
const { mockUser, mockDriver, mockAdmin } = require('../../fixtures/mockData');

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      user: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('requireRole middleware', () => {
    it('should call next() when user has required role', () => {
      mockReq.user = { id: mockDriver.id, role: 'DRIVER' };

      const middleware = requireRole('DRIVER');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next() when user has one of required roles', () => {
      mockReq.user = { id: mockAdmin.id, role: 'ADMIN' };

      const middleware = requireRole('ADMIN', 'DRIVER');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 when user does not have required role', () => {
      mockReq.user = { id: mockUser.id, role: 'RIDER' };

      const middleware = requireRole('DRIVER');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringContaining('permission')
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      const middleware = requireRole('DRIVER');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for multiple roles when none match', () => {
      mockReq.user = { id: mockUser.id, role: 'RIDER' };

      const middleware = requireRole('DRIVER', 'ADMIN');
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
