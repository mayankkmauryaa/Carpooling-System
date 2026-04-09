const express = require('express');
const router = express.Router();
const tripController = require('../../controllers/tripController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  startTripSchema,
  completeTripSchema,
  cancelTripSchema,
  tripIdParamSchema,
  getTripsQuerySchema
} = require('../../validators/trip.validator');

router.get('/', auth, validate(getTripsQuerySchema, 'query'), tripController.getMyTrips);
router.get('/all', auth, requireRole('ADMIN'), tripController.getAllTrips);
router.get('/:id', auth, validate(tripIdParamSchema, 'params'), tripController.getTripById);
router.post('/:id/start', auth, requireRole('DRIVER'), validate(tripIdParamSchema, 'params'), tripController.startTrip);
router.post('/:id/complete', auth, requireRole('DRIVER'), validate(tripIdParamSchema, 'params'), validate(completeTripSchema), tripController.completeTrip);
router.post('/:id/cancel', auth, validate(tripIdParamSchema, 'params'), validate(cancelTripSchema), tripController.cancelTrip);
router.get('/driver/:driverId', auth, requireRole('ADMIN'), tripController.getTripsByDriver);
router.get('/rider/:riderId', auth, requireRole('ADMIN'), tripController.getTripsByRider);
router.get('/ridepool/:ridePoolId', auth, tripController.getTripByRidePool);
router.get('/date/:date', auth, tripController.getTripsByDate);
router.get('/status/:status', auth, tripController.getTripsByStatus);
router.get('/upcoming', auth, tripController.getUpcomingTrips);
router.get('/stats', auth, requireRole('ADMIN'), tripController.getTripStats);

module.exports = router;
