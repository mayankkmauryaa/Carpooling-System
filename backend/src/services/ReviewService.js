const BaseService = require('./base/BaseService');
const { reviewRepository, tripRepository, userRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, ConflictException } = require('../exceptions');
const logger = require('../middleware/logger');
const userService = require('./UserService');

class ReviewService extends BaseService {
  constructor() {
    super(reviewRepository);
  }

  async createReview(reviewerId, reviewData) {
    const { tripId, revieweeId, type, rating, comment } = reviewData;

    const trip = await tripRepository.findById(tripId);
    
    if (!trip) {
      throw NotFoundException.trip(tripId);
    }

    if (trip.status !== 'completed') {
      throw ConflictException('Can only review completed trips');
    }

    const isValidReviewer = 
      trip.driverId.toString() === reviewerId.toString() ||
      trip.riderIds.some(r => r.toString() === reviewerId.toString());

    if (!isValidReviewer) {
      throw ForbiddenException.notOwner();
    }

    const hasReviewed = await this.repository.hasReviewed(tripId, reviewerId);
    if (hasReviewed) {
      throw ConflictException.alreadyReviewed();
    }

    const review = await this.repository.create({
      tripId,
      reviewerId,
      revieweeId,
      type,
      rating,
      comment,
      isVisible: true
    });

    await userService.updateUserRating(revieweeId);

    logger.info('Review created', { reviewId: review._id });

    return review;
  }

  async getUserReviews(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await this.paginate(
      { revieweeId: userId, isVisible: true },
      {
        populate: [
          { path: 'reviewerId', select: 'firstName lastName' },
          'tripId'
        ],
        page,
        limit
      }
    );
  }

  async getTripReviews(tripId) {
    return await this.repository.findByTrip(tripId);
  }

  async getMyReviews(reviewerId, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return await this.paginate(
      { reviewerId },
      {
        populate: [
          { path: 'revieweeId', select: 'firstName lastName' },
          'tripId'
        ],
        page,
        limit
      }
    );
  }

  async getReviewById(reviewId) {
    const review = await this.findById(reviewId, {
      populate: [
        { path: 'reviewerId', select: 'firstName lastName' },
        { path: 'revieweeId', select: 'firstName lastName' },
        'tripId'
      ]
    });

    if (!review) {
      throw NotFoundException.review(reviewId);
    }

    return review;
  }

  async deleteReview(reviewId, userId, userRole) {
    const review = await this.findById(reviewId);
    
    if (!review) {
      throw NotFoundException.review(reviewId);
    }

    if (review.reviewerId.toString() !== userId.toString() && userRole !== 'admin') {
      throw ForbiddenException.notOwner();
    }

    await this.deleteById(reviewId);

    await userService.updateUserRating(review.revieweeId);

    logger.info('Review deleted', { reviewId });

    return { message: 'Review deleted successfully' };
  }

  async getUserReviewStats(userId) {
    const { averageRating, totalReviews } = await this.repository.calculateAverageRating(userId);
    const ratingDistribution = await this.repository.getRatingDistribution(userId);

    return {
      totalReviews,
      averageRating,
      ratingDistribution
    };
  }

  async getAllReviews(options = {}) {
    const { page = 1, limit = 20, type, minRating, maxRating } = options;
    
    const query = {};
    if (type) query.type = type;
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    return await this.paginate(query, {
      populate: [
        { path: 'reviewerId', select: 'firstName lastName email' },
        { path: 'revieweeId', select: 'firstName lastName email' },
        'tripId'
      ],
      page,
      limit
    });
  }
}

module.exports = new ReviewService();
