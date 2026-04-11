const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/adminController');
const { auth, requireRole } = require('../../middleware/auth');

router.use(auth);
router.use(requireRole('ADMIN'));

router.get('/dashboard', adminController.getDashboard);

router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/rides', adminController.getRideAnalytics);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/popular-routes', adminController.getPopularRoutes);
router.get('/analytics/peak-hours', adminController.getPeakHours);

router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.post('/users/:userId/suspend', adminController.suspendUser);
router.post('/users/:userId/unsuspend', adminController.unsuspendUser);
router.delete('/users/:userId', adminController.deleteUser);

router.get('/vehicles', adminController.getAllVehicles);
router.get('/vehicles/:vehicleId', adminController.getVehicleDetails);
router.post('/vehicles', adminController.createVehicle);
router.put('/vehicles/:vehicleId', adminController.updateVehicle);
router.delete('/vehicles/:vehicleId', adminController.deleteVehicle);
router.put('/vehicles/:vehicleId/verification', adminController.updateVehicleVerification);

router.get('/rides', adminController.getAllRides);
router.get('/rides/:rideId', adminController.getRideDetails);
router.post('/rides/:rideId/cancel', adminController.cancelRide);

router.get('/trips', adminController.getAllTrips);
router.get('/trips/:tripId', adminController.getTripDetails);

router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:reviewId', adminController.deleteReview);

router.get('/sos', adminController.getSOSAlerts);
router.put('/sos/:alertId/status', adminController.updateSOSAlertStatus);

router.get('/messages', adminController.getMessages);

module.exports = router;
