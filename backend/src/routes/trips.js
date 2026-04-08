const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/', auth, tripController.getMyTrips);
router.get('/all', auth, requireRole('admin'), tripController.getAllTrips);
router.get('/:id', auth, tripController.getTripById);
router.post('/:id/start', auth, requireRole('driver'), tripController.startTrip);
router.post('/:id/complete', auth, requireRole('driver'), tripController.completeTrip);
router.post('/:id/cancel', auth, tripController.cancelTrip);
router.get('/driver/:driverId', auth, requireRole('admin'), tripController.getTripsByDriver);
router.get('/rider/:riderId', auth, requireRole('admin'), tripController.getTripsByRider);
router.get('/ridepool/:ridePoolId', auth, tripController.getTripByRidePool);
router.get('/date/:date', auth, tripController.getTripsByDate);
router.get('/status/:status', auth, tripController.getTripsByStatus);
router.get('/upcoming', auth, tripController.getUpcomingTrips);
router.get('/stats', auth, requireRole('admin'), tripController.getTripStats);

module.exports = router;
