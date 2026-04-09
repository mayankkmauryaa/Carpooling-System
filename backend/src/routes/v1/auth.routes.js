const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const { registerSchema, loginSchema, googleTokenSchema } = require('../../validators/auth.validator');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', auth, authController.refresh);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.get('/verify', auth, authController.verify);

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.post('/google/mobile', validate(googleTokenSchema), authController.googleMobile);
router.post('/google/link', auth, validate(googleTokenSchema), authController.linkGoogleAccount);

module.exports = router;
