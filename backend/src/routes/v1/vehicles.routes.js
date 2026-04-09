const express = require('express');
const router = express.Router();
const vehicleController = require('../../controllers/vehicleController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  getVehiclesQuerySchema
} = require('../../validators/vehicle.validator');

router.post('/', auth, requireRole('driver'), validate(createVehicleSchema), vehicleController.createVehicle);
router.get('/', auth, validate(getVehiclesQuerySchema, 'query'), vehicleController.getMyVehicles);
router.get('/all', auth, requireRole('admin'), vehicleController.getAllVehicles);
router.get('/:id', auth, validate(vehicleIdParamSchema, 'params'), vehicleController.getVehicleById);
router.put('/:id', auth, validate(vehicleIdParamSchema, 'params'), validate(updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', auth, validate(vehicleIdParamSchema, 'params'), vehicleController.deleteVehicle);
router.put('/:id/status', auth, validate(vehicleIdParamSchema, 'params'), vehicleController.toggleVehicleStatus);
router.get('/driver/:driverId', auth, requireRole('admin'), vehicleController.getVehiclesByDriver);

module.exports = router;
