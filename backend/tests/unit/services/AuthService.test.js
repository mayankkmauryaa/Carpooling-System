const { mockUser, createMockToken } = require('../../fixtures/mockData');

jest.mock('../../../src/config', () => ({
  jwt: {
    JWT_SECRET: 'test-secret-key-for-testing-only',
    JWT_EXPIRES_IN: '24h'
  },
  google: {
    GOOGLE_CLIENT_ID: 'test-client-id'
  }
}));

jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const { userRepository } = require('../../../src/repositories');

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = require('../../../src/services/AuthService');
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = authService.generateToken(mockUser.id);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = authService.generateToken(mockUser.id);
      const decoded = authService.verifyToken(token);
      
      expect(decoded.userId).toBe(mockUser.id);
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow();
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'RIDER'
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        ...mockUser,
        ...userData,
        id: 1
      });

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should throw error if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register({
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test'
      })).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should throw error for invalid email', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login('invalid@example.com', 'password'))
        .rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should generate new token for valid user', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.refreshToken(mockUser.id);

      expect(result).toHaveProperty('token');
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password from user object', () => {
      const user = { id: 1, email: 'test@test.com', password: 'secret' };
      const result = authService.sanitizeUser(user);
      
      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('email');
    });

    it('should return null for null user', () => {
      const result = authService.sanitizeUser(null);
      expect(result).toBeNull();
    });
  });
});
