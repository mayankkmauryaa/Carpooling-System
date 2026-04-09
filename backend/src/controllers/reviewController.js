const { reviewService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.createReview = async (req, res, next) => {
  try {
    await reviewService.createReview(req.user._id, req.body);
    res.status(201).json(ApiResponse.created(null, 'Review submitted'));
  } catch (error) {
    next(error);
  }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await reviewService.getUserReviews(req.params.userId, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getTripReviews(req.params.tripId);
    res.json(ApiResponse.success({ reviews }));
  } catch (error) {
    next(error);
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, minRating, maxRating } = req.query;
    const result = await reviewService.getAllReviews({ page, limit, type, minRating, maxRating });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await reviewService.getMyReviews(req.user._id, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getReviewById = async (req, res, next) => {
  try {
    const review = await reviewService.getReviewById(req.params.id);
    res.json(ApiResponse.success({ review }));
  } catch (error) {
    next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.params.id, req.user._id, req.user.role);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getUserReviewStats = async (req, res, next) => {
  try {
    const stats = await reviewService.getUserReviewStats(req.params.userId);
    res.json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
