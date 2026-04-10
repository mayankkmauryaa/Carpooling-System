const UserService = require('../../../src/services/UserService');
const { mockUser, mockDriver, mockPaginatedResponse } = require('../../fixtures/mockData');
const { NotFoundException, BadRequestException } = require('../../../src/exceptions');

jest.mock('../../../src/services/base/BaseService');
jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('UserService', () => {
  let userService;
  let mockUserRepository;
  let mockCacheService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      count: jest.fn(),
      paginate: jest.fn()
    };

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    };

    userService = new UserService(mockUserRepository, mockCacheService);
  });

  describe('getUserById', () => {
    it('should return user from cache if available', async () => {
      const cachedUser = { ...mockUser };
      mockCacheService.get.mockResolvedValue(cachedUser);

      const result = await userService.getUserById(mockUser.id);

      expect(mockCacheService.get).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(result).toEqual(cachedUser);
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from DB and cache if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(mockUser.id);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockCacheService.set).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(999))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updatedUser = { ...mockUser, ...updateData };

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await userService.updateProfile(mockUser.id, updateData);

      expect(mockUserRepository.updateById).toHaveBeenCalledWith(mockUser.id, updateData);
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:${mockUser.id}`);
      expect(result.firstName).toBe('Updated');
    });

    it('should filter out empty values', async () => {
      const updateData = { firstName: '', lastName: 'Valid' };
      const updatedUser = { ...mockUser, lastName: 'Valid' };

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      await userService.updateProfile(mockUser.id, updateData);

      const updateCall = mockUserRepository.updateById.mock.calls[0][1];
      expect(updateCall.firstName).toBeUndefined();
    });
  });

  describe('toggleUserStatus', () => {
    it('should activate inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const activeUser = { ...mockUser, isActive: true };

      mockUserRepository.findById.mockResolvedValue(inactiveUser);
      mockUserRepository.updateById.mockResolvedValue(activeUser);

      const result = await userService.toggleUserStatus(mockUser.id);

      expect(result.isActive).toBe(true);
    });

    it('should deactivate active user', async () => {
      const activeUser = { ...mockUser, isActive: true };
      const inactiveUser = { ...mockUser, isActive: false };

      mockUserRepository.findById.mockResolvedValue(activeUser);
      mockUserRepository.updateById.mockResolvedValue(inactiveUser);

      const result = await userService.toggleUserStatus(mockUser.id);

      expect(result.isActive).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      const users = [mockUser, mockDriver];
      const paginatedResult = mockPaginatedResponse(users, 1, 10, 2);

      mockUserRepository.paginate.mockResolvedValue(paginatedResult);

      const result = await userService.getAllUsers({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(2);
    });

    it('should filter by role', async () => {
      const drivers = [mockDriver];
      mockUserRepository.paginate.mockResolvedValue(mockPaginatedResponse(drivers, 1, 10, 1));

      const result = await userService.getAllUsers({ role: 'DRIVER', page: 1, limit: 10 });

      expect(mockUserRepository.paginate).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user and invalidate cache', async () => {
      mockUserRepository.deleteById.mockResolvedValue(mockUser);

      await userService.deleteUser(mockUser.id);

      expect(mockUserRepository.deleteById).toHaveBeenCalledWith(mockUser.id);
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:${mockUser.id}`);
    });
  });

  describe('getUserRating', () => {
    it('should return user rating info', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserRating(mockUser.id);

      expect(result).toHaveProperty('rating');
      expect(result).toHaveProperty('totalReviews');
    });
  });

  describe('updateUserRating', () => {
    it('should update user rating', async () => {
      const newRating = 4.8;
      const totalReviews = 15;

      mockUserRepository.updateById.mockResolvedValue({
        ...mockUser,
        rating: newRating,
        totalReviews
      });

      const result = await userService.updateUserRating(mockUser.id, newRating, totalReviews);

      expect(result.rating).toBe(newRating);
      expect(result.totalReviews).toBe(totalReviews);
    });
  });
});
