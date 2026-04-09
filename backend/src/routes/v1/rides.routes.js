const express = require('express');
const router = express.Router();
const rideController = require('../../controllers/rideController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  createRideSchema,
  searchRideSchema,
  joinRideSchema,
  rideIdParamSchema,
  respondToRequestSchema,
  updateRideStatusSchema
} = require('../../validators/ride.validator');

router.post('/', auth, requireRole('driver'), validate(createRideSchema), rideController.createRide);
router.get('/', auth, rideController.getMyRides);
router.get('/search', auth, validate(searchRideSchema, 'query'), rideController.searchRides);
router.get('/recommendations', auth, rideController.getRecommendations);
router.get('/all', auth, requireRole('admin'), rideController.getAllRides);
router.get('/:id', auth, validate(rideIdParamSchema, 'params'), rideController.getRideById);
router.put('/:id', auth, validate(rideIdParamSchema, 'params'), rideController.updateRide);
router.delete('/:id', auth, validate(rideIdParamSchema, 'params'), rideController.cancelRide);
router.get('/:id/requests', auth, requireRole('driver'), validate(rideIdParamSchema, 'params'), rideController.getRideRequests);
router.put('/:id/requests/:riderId', auth, requireRole('driver'), validate(rideIdParamSchema, 'params'), validate(respondToRequestSchema), rideController.respondToRequest);
router.post('/:id/join', auth, validate(rideIdParamSchema, 'params'), validate(joinRideSchema), rideController.requestToJoin);
router.get('/my-requests', auth, rideController.getMyRequests);
router.delete('/:id/join', auth, validate(rideIdParamSchema, 'params'), rideController.cancelJoinRequest);
router.put('/:id/status', auth, requireRole('admin'), validate(rideIdParamSchema, 'params'), validate(updateRideStatusSchema), rideController.updateRideStatus);
router.get('/driver/:driverId', auth, requireRole('admin'), rideController.getRidesByDriver);
router.get('/date/:date', auth, rideController.getRidesByDate);
router.get('/upcoming', auth, rideController.getUpcomingRides);
router.get('/nearby', auth, rideController.getNearbyRides);

module.exports = router;
