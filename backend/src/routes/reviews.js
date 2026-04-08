const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, reviewController.createReview);
router.get('/user/:userId', auth, reviewController.getUserReviews);
router.get('/trip/:tripId', auth, reviewController.getTripReviews);
router.get('/all', auth, requireRole('admin'), reviewController.getAllReviews);
router.get('/my-reviews', auth, reviewController.getMyReviews);
router.get('/:id', auth, reviewController.getReviewById);
router.delete('/:id', auth, reviewController.deleteReview);
router.get('/stats/user/:userId', auth, reviewController.getUserReviewStats);

module.exports = router;
