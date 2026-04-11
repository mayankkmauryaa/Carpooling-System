const { mockUser } = require('../../fixtures/mockData');

jest.mock('../../../src/repositories', () => ({
  userRepository: {
    findById: jest.fn(),
    deleteById: jest.fn(),
  }
}));

jest.mock('../../../src/middleware/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

const { userRepository } = require('../../../src/repositories');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = require('../../../src/services/UserService');
  });

  describe('getUserById', () => {
    it('should fetch user from database', async () => {
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(mockUser.id);

      expect(userRepository.findById).toHaveBeenCalled();
    });

    it('should throw error for non-existent user', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(999)).rejects.toThrow();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      userRepository.deleteById.mockResolvedValue({ id: mockUser.id });

      await userService.deleteUser(mockUser.id);

      expect(userRepository.deleteById).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
