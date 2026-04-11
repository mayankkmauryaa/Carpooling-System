const express = require('express');
const router = express.Router();
const payoutController = require('../controllers/payoutController');
const { auth, requireRole } = require('../../middleware/auth');

router.get('/earnings', auth, requireRole('DRIVER'), payoutController.getDriverEarnings);
router.get('/earnings/summary', auth, requireRole('DRIVER'), payoutController.getDriverEarningsSummary);
router.get('/my-earnings', auth, payoutController.getMyEarnings);
router.get('/owner/history', auth, requireRole('OWNER'), payoutController.getOwnerPayoutHistory);
router.get('/stats', auth, payoutController.getPayoutStats);

module.exports = router;