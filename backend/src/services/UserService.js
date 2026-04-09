const bcrypt = require('bcryptjs');
const BaseService = require('./base/BaseService');
const { userRepository, reviewRepository } = require('../repositories');
const { NotFoundException, BadRequestException } = require('../exceptions');
const logger = require('../middleware/logger');

class UserService extends BaseService {
  constructor() {
    super(userRepository);
  }

  async getProfile(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw NotFoundException.user(userId);
    }
    return user;
  }

  async updateProfile(userId, updates) {
    const user = await this.repository.updateProfile(userId, updates);
    if (!user) {
      throw NotFoundException.user(userId);
    }
    logger.info('Profile updated', { userId });
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw NotFoundException.user(userId);
    }

    if (!user.password) {
      throw BadRequestException('Cannot change password for Google users');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.repository.updateById(userId, { password: hashedPassword });

    logger.info('Password changed', { userId });

    return { message: 'Password updated successfully' };
  }

  async getUserById(userId) {
    const user = await this.findById(userId);
    if (!user) {
      throw NotFoundException.user(userId);
    }
    return user;
  }

  async getAllUsers(options = {}) {
    return await this.repository.paginate({}, options);
  }

  async toggleUserStatus(userId) {
    const user = await this.repository.toggleStatus(userId);
    if (!user) {
      throw NotFoundException.user(userId);
    }
    logger.info('User status toggled', { userId, isActive: user.isActive });
    return user;
  }

  async deleteUser(userId) {
    const user = await this.deleteById(userId);
    if (!user) {
      throw NotFoundException.user(userId);
    }
    logger.info('User deleted', { userId });
    return { message: 'User deleted successfully' };
  }

  async getDrivers(options = {}) {
    return await this.repository.paginate({ role: 'DRIVER' }, options);
  }

  async getRiders(options = {}) {
    return await this.repository.paginate({ role: 'RIDER' }, options);
  }

  async getUserReviews(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await reviewRepository.getUserReviewsPaginated(userId, { page, limit });
  }

  async updateUserRating(userId) {
    const { averageRating, totalReviews } = await reviewRepository.calculateAverageRating(userId);
    
    await this.repository.updateRating(userId, averageRating, totalReviews);
    
    return { averageRating, totalReviews };
  }
}

module.exports = new UserService();
