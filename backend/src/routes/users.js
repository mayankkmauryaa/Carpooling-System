const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, requireRole } = require('../middleware/auth');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.put('/password', auth, userController.changePassword);
router.get('/:id', auth, userController.getUserById);
router.get('/:userId/reviews', auth, userController.getUserReviews);
router.get('/', auth, userController.getAllUsers);
router.get('/drivers', auth, requireRole('admin'), userController.getAllDrivers);
router.get('/riders', auth, requireRole('admin'), userController.getAllRiders);
router.put('/:id/status', auth, requireRole('admin'), userController.toggleUserStatus);
router.delete('/:id', auth, requireRole('admin'), userController.deleteUser);

module.exports = router;
