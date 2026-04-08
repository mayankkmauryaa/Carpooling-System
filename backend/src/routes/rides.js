const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, requireRole('driver'), rideController.createRide);
router.get('/', auth, rideController.getMyRides);
router.get('/search', auth, rideController.searchRides);
router.get('/recommendations', auth, rideController.getRecommendations);
router.get('/all', auth, requireRole('admin'), rideController.getAllRides);
router.get('/:id', auth, rideController.getRideById);
router.put('/:id', auth, rideController.updateRide);
router.delete('/:id', auth, rideController.cancelRide);
router.get('/:id/requests', auth, requireRole('driver'), rideController.getRideRequests);
router.put('/:id/requests/:riderId', auth, requireRole('driver'), rideController.respondToRequest);
router.post('/:id/join', auth, rideController.requestToJoin);
router.get('/my-requests', auth, rideController.getMyRequests);
router.delete('/:id/join', auth, rideController.cancelJoinRequest);
router.put('/:id/status', auth, requireRole('admin'), rideController.updateRideStatus);
router.get('/driver/:driverId', auth, requireRole('admin'), rideController.getRidesByDriver);
router.get('/date/:date', auth, rideController.getRidesByDate);
router.get('/upcoming', auth, rideController.getUpcomingRides);
router.get('/nearby', auth, rideController.getNearbyRides);

module.exports = router;
