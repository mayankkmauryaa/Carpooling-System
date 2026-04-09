const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  userReviewsQuerySchema,
  getAllUsersQuerySchema
} = require('../../validators/user.validator');

router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validate(updateProfileSchema), userController.updateProfile);
router.put('/password', auth, validate(changePasswordSchema), userController.changePassword);
router.get('/:id', auth, validate(userIdParamSchema, 'params'), userController.getUserById);
router.get('/:userId/reviews', auth, validate(userReviewsQuerySchema, 'query'), userController.getUserReviews);
router.get('/', auth, validate(getAllUsersQuerySchema, 'query'), userController.getAllUsers);
router.get('/drivers', auth, requireRole('ADMIN'), userController.getAllDrivers);
router.get('/riders', auth, requireRole('ADMIN'), userController.getAllRiders);
router.put('/:id/status', auth, requireRole('ADMIN'), validate(userIdParamSchema, 'params'), userController.toggleUserStatus);
router.delete('/:id', auth, requireRole('ADMIN'), validate(userIdParamSchema, 'params'), userController.deleteUser);

module.exports = router;
