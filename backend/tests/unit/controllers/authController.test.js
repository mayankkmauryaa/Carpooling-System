const authController = require('../../../src/controllers/authController');
const { mockUser } = require('../../fixtures/mockData');

jest.mock('../../../src/services/AuthService');
jest.mock('../../../src/middleware/auth', () => ({
  blacklistToken: jest.fn()
}));
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const { authService } = require('../../../src/services');

describe.skip('AuthController', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register new user and return 201', async () => {
      mockReq = {
        body: {
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User'
        }
      };

      authService.register.mockResolvedValue({
        user: { ...mockUser, email: mockReq.body.email },
        token: 'jwt-token'
      });

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('registered')
      }));
    });

    it('should call next with error on failure', async () => {
      mockReq = {
        body: { email: 'test@example.com' }
      };

      const error = new Error('Service failed');
      authService.register.mockRejectedValue(error);

      await authController.register(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      mockReq = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };

      authService.login.mockResolvedValue({
        user: mockUser,
        token: 'jwt-token'
      });

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });

    it('should call next with error on invalid credentials', async () => {
      mockReq = {
        body: {
          email: 'test@example.com',
          password: 'wrong'
        }
      };

      const error = new Error('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await authController.login(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockReq = {
        token: 'jwt-token'
      };

      await authController.logout(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('Logged out')
      }));
    });
  });

  describe('refresh', () => {
    it('should refresh token', async () => {
      mockReq = {
        user: { id: 1 }
      };

      authService.refreshToken.mockResolvedValue({
        token: 'new-jwt-token'
      });

      await authController.refresh(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      mockReq = {
        user: { id: 1 }
      };

      authService.getCurrentUser.mockResolvedValue({
        user: mockUser
      });

      await authController.getMe(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true
      }));
    });
  });
});
