const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/reviewController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  createReviewSchema,
  reviewIdParamSchema,
  userIdParamSchema,
  tripIdParamSchema,
  getReviewsQuerySchema
} = require('../../validators/review.validator');

router.post('/', auth, validate(createReviewSchema), reviewController.createReview);
router.get('/user/:userId', auth, validate(userIdParamSchema, 'params'), validate(getReviewsQuerySchema, 'query'), reviewController.getUserReviews);
router.get('/trip/:tripId', auth, validate(tripIdParamSchema, 'params'), reviewController.getTripReviews);
router.get('/all', auth, requireRole('ADMIN'), reviewController.getAllReviews);
router.get('/my-reviews', auth, reviewController.getMyReviews);
router.get('/:id', auth, validate(reviewIdParamSchema, 'params'), reviewController.getReviewById);
router.delete('/:id', auth, validate(reviewIdParamSchema, 'params'), reviewController.deleteReview);
router.get('/stats/user/:userId', auth, validate(userIdParamSchema, 'params'), reviewController.getUserReviewStats);

module.exports = router;
