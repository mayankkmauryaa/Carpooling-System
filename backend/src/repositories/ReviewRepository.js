const BaseRepository = require('./base/BaseRepository');
const Review = require('../models/Review');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByTrip(tripId) {
    return await this.findAll({ tripId, isVisible: true });
  }

  async findByReviewer(reviewerId, options = {}) {
    return await this.findAll({ reviewerId }, {
      ...options,
      populate: ['revieweeId', 'tripId']
    });
  }

  async findByReviewee(revieweeId, options = {}) {
    return await this.findAll({ revieweeId, isVisible: true }, {
      ...options,
      populate: ['reviewerId', 'tripId']
    });
  }

  async hasReviewed(tripId, reviewerId) {
    return await this.exists({ tripId, reviewerId });
  }

  async calculateAverageRating(revieweeId) {
    const result = await this.model.aggregate([
      { $match: { revieweeId: revieweeId, isVisible: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (result.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews
    };
  }

  async getRatingDistribution(revieweeId) {
    const result = await this.model.aggregate([
      { $match: { revieweeId: revieweeId, isVisible: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.forEach(({ _id, count }) => {
      if (distribution[_id] !== undefined) {
        distribution[_id] = count;
      }
    });

    return distribution;
  }

  async getUserReviewsPaginated(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.model.find({ revieweeId: userId, isVisible: true })
        .populate('reviewerId', 'firstName lastName profilePicture')
        .populate('tripId', 'startTime startLocation dropLocation')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      this.count({ revieweeId: userId, isVisible: true })
    ]);

    return {
      items: reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }
}

module.exports = new ReviewRepository();
