const express = require('express');
const router = express.Router();
const ownerController = require('../../controllers/ownerController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const { registerOwnerSchema, updateOwnerProfileSchema } = require('../../validators/owner.validator');

router.post(
  '/register',
  auth,
  requireRole('RIDER'),
  validate(registerOwnerSchema),
  ownerController.register
);

router.get(
  '/profile',
  auth,
  requireRole('OWNER'),
  ownerController.getMyProfile
);

router.put(
  '/profile',
  auth,
  requireRole('OWNER'),
  validate(updateOwnerProfileSchema),
  ownerController.updateProfile
);

router.get(
  '/dashboard',
  auth,
  requireRole('OWNER'),
  ownerController.getDashboard
);

module.exports = router;
