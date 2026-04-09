const BaseRepository = require('./base/BaseRepository');
const User = require('../models/User');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, select = '') {
    return await this.model.findOne({ email }).select(select);
  }

  async findByEmailWithPassword(email) {
    return await this.model.findOne({ email }).select('+password');
  }

  async toggleStatus(id) {
    const user = await this.findById(id);
    if (user) {
      user.isActive = !user.isActive;
      return await user.save();
    }
    return null;
  }

  async updateRating(userId, rating, totalReviews) {
    return await this.updateById(userId, { rating, totalReviews });
  }

  async updateProfile(userId, updates) {
    const allowedFields = ['firstName', 'lastName', 'phone', 'profilePicture', 'isProfileBlurred'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    return await this.updateById(userId, filteredUpdates);
  }
}

module.exports = new UserRepository();
