const request = require('supertest');
const express = require('express');
const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/AuthService');
const { createMockToken, mockUser, mockDriver } = require('../../fixtures/mockData');

jest.mock('../../../src/services/AuthService');
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('AuthController', () => {
  let app;
  let mockAuthService;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      verifyToken: jest.fn(),
      logout: jest.fn()
    };

    authController(mockAuthService, app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register new user and return 201', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      mockAuthService.register.mockResolvedValue({
        user: { ...mockUser, email: userData.email },
        token: 'jwt-token'
      });

      const response = await request(app)
        .post('/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });

    it('should return 409 for existing email', async () => {
      const { ConflictException } = require('../../../src/exceptions');
      
      mockAuthService.register.mockRejectedValue(
        new ConflictException('Email already exists')
      );

      const response = await request(app)
        .post('/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /login', () => {
    it('should login successfully and return token', async () => {
      mockAuthService.login.mockResolvedValue({
        user: mockUser,
        token: 'jwt-token'
      });

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const { AuthException } = require('../../../src/exceptions');
      
      mockAuthService.login.mockRejectedValue(
        new AuthException('invalidCredentials')
      );

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /refresh', () => {
    it('should refresh token successfully', async () => {
      const token = createMockToken(mockUser.id);
      mockAuthService.refreshToken.mockResolvedValue({
        token: 'new-jwt-token'
      });

      const response = await request(app)
        .post('/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
    });
  });

  describe('GET /verify', () => {
    it('should verify token and return user id', async () => {
      const token = createMockToken(mockUser.id);
      mockAuthService.verifyToken.mockResolvedValue({
        userId: mockUser.id,
        role: mockUser.role
      });

      const response = await request(app)
        .get('/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('valid', true);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/verify');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const token = createMockToken(mockUser.id);
      mockAuthService.logout.mockResolvedValue({
        message: 'Logged out successfully'
      });

      const response = await request(app)
        .post('/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});
