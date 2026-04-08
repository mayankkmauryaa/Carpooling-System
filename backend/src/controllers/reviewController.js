const Review = require('../models/Review');
const Trip = require('../models/Trip');
const User = require('../models/User');
const logger = require('../middleware/logger');

exports.createReview = async (req, res, next) => {
  try {
    const { tripId, revieweeId, type, rating, comment } = req.body;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        status: 'error',
        message: 'Trip not found'
      });
    }

    if (trip.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review completed trips'
      });
    }

    const isValidReviewer = 
      trip.driverId.toString() === req.user._id.toString() ||
      trip.riderIds.some(r => r.toString() === req.user._id.toString());

    if (!isValidReviewer) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to review this trip'
      });
    }

    const existingReview = await Review.findOne({
      tripId,
      reviewerId: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this trip'
      });
    }

    const review = await Review.create({
      tripId,
      reviewerId: req.user._id,
      revieweeId,
      type,
      rating,
      comment,
      isVisible: false
    });

    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      const allReviews = await Review.find({ revieweeId, isVisible: true });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      reviewee.rating = Math.round(avgRating * 10) / 10;
      reviewee.totalReviews = allReviews.length;
      await reviewee.save();
    }

    review.isVisible = true;
    await review.save();

    logger.info('Review created', { reviewId: review._id });

    res.status(201).json({
      status: 'success',
      message: 'Review submitted'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { revieweeId: req.params.userId, isVisible: true };
    
    const reviews = await Review.find(query)
      .populate('reviewerId', 'firstName lastName')
      .populate('tripId')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(query);

    const averageRating = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    res.json({
      status: 'success',
      data: {
        reviews,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTripReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ tripId: req.params.tripId, isVisible: true })
      .populate('reviewerId', 'firstName lastName')
      .populate('revieweeId', 'firstName lastName');

    res.json({
      status: 'success',
      data: {
        reviews
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, minRating, maxRating } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) query.rating.$gte = parseInt(minRating);
      if (maxRating) query.rating.$lte = parseInt(maxRating);
    }

    const reviews = await Review.find(query)
      .populate('reviewerId', 'firstName lastName email')
      .populate('revieweeId', 'firstName lastName email')
      .populate('tripId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-createdAt');

    const total = await Review.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        reviews,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({ reviewerId: req.user._id })
      .populate('revieweeId', 'firstName lastName')
      .populate('tripId')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ reviewerId: req.user._id });

    res.json({
      status: 'success',
      data: {
        reviews,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewerId', 'firstName lastName')
      .populate('revieweeId', 'firstName lastName')
      .populate('tripId');

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        review
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: 'Review not found'
      });
    }

    if (review.reviewerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.json({
      status: 'success',
      message: 'Review deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserReviewStats = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    
    const reviews = await Review.find({ revieweeId: userId, isVisible: true });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;
    
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };

    res.json({
      status: 'success',
      data: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      }
    });
  } catch (error) {
    next(error);
  }
};
