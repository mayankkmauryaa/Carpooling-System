const express = require('express');
const router = express.Router();
const deviceService = require('../services/DeviceService');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../middleware/logger');

router.post('/register', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token, deviceType, deviceName, appVersion, fcmToken } = req.body;

    const result = await deviceService.registerDevice(userId, {
      token,
      deviceType,
      deviceName,
      appVersion,
      fcmToken
    });

    res.status(201).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Device registration error', { error: error.message });
    next(error);
  }
});

router.delete('/:token', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.params;

    const result = await deviceService.removeDevice(userId, token);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Device removal error', { error: error.message });
    next(error);
  }
});

router.get('/my-tokens', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const devices = await deviceService.getUserDevices(userId);

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    logger.error('Get devices error', { error: error.message });
    next(error);
  }
});

router.put('/deactivate', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const result = await deviceService.deactivateDevice(userId, token);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error('Device deactivation error', { error: error.message });
    next(error);
  }
});

module.exports = router;