const express = require('express');
const router = express.Router();
const fleetController = require('../../controllers/fleetController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const { assignDriverSchema, paginationSchema, utilizationSchema, performanceSchema } = require('../../validators/fleet.validator');

router.get(
  '/profile',
  auth,
  requireRole('OWNER'),
  fleetController.getFleetProfile
);

router.get(
  '/vehicles',
  auth,
  requireRole('OWNER'),
  validate(paginationSchema, 'query'),
  fleetController.getFleetVehicles
);

router.get(
  '/drivers',
  auth,
  requireRole('OWNER'),
  validate(paginationSchema, 'query'),
  fleetController.getFleetDrivers
);

router.get(
  '/stats',
  auth,
  requireRole('OWNER'),
  fleetController.getFleetStats
);

router.get(
  '/utilization',
  auth,
  requireRole('OWNER'),
  validate(utilizationSchema, 'query'),
  fleetController.getVehicleUtilization
);

router.get(
  '/performance',
  auth,
  requireRole('OWNER'),
  validate(performanceSchema, 'query'),
  fleetController.getPerformance
);

router.post(
  '/assign-driver',
  auth,
  requireRole('OWNER'),
  validate(assignDriverSchema),
  fleetController.assignDriver
);

module.exports = router;
