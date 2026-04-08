const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { auth, requireRole } = require('../middleware/auth');

router.post('/', auth, requireRole('driver'), vehicleController.createVehicle);
router.get('/', auth, vehicleController.getMyVehicles);
router.get('/all', auth, requireRole('admin'), vehicleController.getAllVehicles);
router.get('/:id', auth, vehicleController.getVehicleById);
router.put('/:id', auth, vehicleController.updateVehicle);
router.delete('/:id', auth, vehicleController.deleteVehicle);
router.put('/:id/status', auth, vehicleController.toggleVehicleStatus);
router.get('/driver/:driverId', auth, requireRole('admin'), vehicleController.getVehiclesByDriver);

module.exports = router;
