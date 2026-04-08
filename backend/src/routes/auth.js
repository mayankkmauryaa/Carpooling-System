const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', auth, authController.refresh);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.get('/verify', auth, async (req, res) => {
  res.json({ status: 'success', data: { valid: true, userId: req.user._id } });
});

module.exports = router;
