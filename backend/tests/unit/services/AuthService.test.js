const AuthService = require('../../../src/services/AuthService');
const { mockUser, mockDriver, hashPassword, createMockToken } = require('../../fixtures/mockData');
const { AuthException, ConflictException, BadRequestException } = require('../../../src/exceptions');

jest.mock('../../../src/services/base/BaseService');
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('AuthService', () => {
  let authService;
  let mockUserRepository;
  let mockCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUserRepository = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };

    authService = new AuthService(mockUserRepository, mockCacheService);
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

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        ...mockUser,
        email: userData.email,
        firstName: userData.firstName
      });

      const result = await authService.register(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should throw ConflictException if email exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(userData))
        .rejects
        .toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainPassword',
        firstName: 'Test',
        lastName: 'User'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation(async (data) => ({
        ...mockUser,
        ...data,
        password: data.password
      }));

      await authService.register(userData);

      const createCall = mockUserRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('plainPassword');
      expect(createCall.password).toMatch(/^\$2[ab]\$/);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await hashPassword('password123');
      const userWithPassword = { ...mockUser, password: hashedPassword };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(userWithPassword);

      const result = await authService.login('test@example.com', 'password123');

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
    });

    it('should throw AuthException for invalid email', async () => {
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login('invalid@example.com', 'password'))
        .rejects
        .toThrow(AuthException);
    });

    it('should throw AuthException for wrong password', async () => {
      const hashedPassword = await hashPassword('correctPassword');
      const userWithPassword = { ...mockUser, password: hashedPassword };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(userWithPassword);

      await expect(authService.login('test@example.com', 'wrongPassword'))
        .rejects
        .toThrow(AuthException);
    });

    it('should throw AuthException for inactive user', async () => {
      const hashedPassword = await hashPassword('password123');
      const inactiveUser = { ...mockUser, password: hashedPassword, isActive: false };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(inactiveUser);

      await expect(authService.login('test@example.com', 'password123'))
        .rejects
        .toThrow(AuthException);
    });
  });

  describe('refreshToken', () => {
    it('should generate new token for valid user', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.refreshToken(mockUser.id);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toHaveProperty('token');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.refreshToken(999))
        .rejects
        .toThrow();
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = createMockToken(mockUser.id, mockUser.role);

      const result = await authService.verifyToken(token);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('role');
    });

    it('should throw AuthException for invalid token', async () => {
      await expect(authService.verifyToken('invalid-token'))
        .rejects
        .toThrow(AuthException);
    });
  });

  describe('logout', () => {
    it('should invalidate user cache', async () => {
      await authService.logout(mockUser.id);

      expect(mockCacheService.del).toHaveBeenCalledWith(`user:${mockUser.id}`);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await hashPassword('currentPassword');
      const userWithPassword = { ...mockUser, password: hashedPassword };

      mockUserRepository.findByIdWithPassword.mockResolvedValue(userWithPassword);
      mockUserRepository.update.mockResolvedValue({ ...mockUser });

      const result = await authService.changePassword(
        mockUser.id,
        'currentPassword',
        'newPassword123'
      );

      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should throw BadRequestException for wrong current password', async () => {
      const hashedPassword = await hashPassword('currentPassword');
      const userWithPassword = { ...mockUser, password: hashedPassword };

      mockUserRepository.findByIdWithPassword.mockResolvedValue(userWithPassword);

      await expect(authService.changePassword(
        mockUser.id,
        'wrongPassword',
        'newPassword123'
      )).rejects.toThrow(BadRequestException);
    });
  });
});
