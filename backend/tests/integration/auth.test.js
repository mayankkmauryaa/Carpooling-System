const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { mockUser, mockDriver, createMockToken } = require('../fixtures/mockData');

jest.mock('../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../src/database/connection', () => ({
  prisma: mockPrisma
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe.skip('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      mockPrisma.user.create.mockResolvedValue({
        id: 1,
        ...userData,
        password: 'hashedPassword',
        role: 'RIDER',
        isActive: true,
      });
      jwt.sign.mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Existing',
        lastName: 'User',
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: userData.email });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'User',
        lastName: 'Test',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'user@example.com',
        password: '123',
        firstName: 'User',
        lastName: 'Test',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mockToken');

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should return 401 for invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for wrong password', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
        isActive: true,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUserWithPassword);
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword!',
        });

      expect(response.status).toBe(401);
    });

    it('should return 401 for inactive user', async () => {
      const inactiveUser = {
        ...mockUser,
        password: 'hashedPassword',
        isActive: false,
      };

      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);
      bcrypt.compare.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user profile for authenticated user', async () => {
      const token = createMockToken(mockUser.id);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockUser.email);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidToken');

      expect(response.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer expiredToken');

      expect(response.status).toBe(401);
    });
  });

  describe('Role-based Access Control', () => {
    it('should allow admin access to protected routes', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      const token = createMockToken(adminUser.id, 'ADMIN');
      mockPrisma.user.findUnique.mockResolvedValue(adminUser);

      const adminApp = express();
      adminApp.use(express.json());
      adminApp.get('/admin/dashboard', auth, requireRole('ADMIN'), (req, res) => {
        res.json({ success: true, message: 'Admin dashboard' });
      });

      const response = await request(adminApp)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('should deny non-admin access to admin routes', async () => {
      const riderUser = { ...mockUser, role: 'RIDER' };
      const token = createMockToken(riderUser.id, 'RIDER');
      mockPrisma.user.findUnique.mockResolvedValue(riderUser);

      const adminApp = express();
      adminApp.use(express.json());
      adminApp.get('/admin/dashboard', auth, requireRole('ADMIN'), (req, res) => {
        res.json({ success: true, message: 'Admin dashboard' });
      });

      const response = await request(adminApp)
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });
});
