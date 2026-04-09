const { messageService, userService, sosService } = require('../services');
const { generateMaskedPhone } = require('../utils/helpers');
const logger = require('../middleware/logger');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.initiateCall = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    const user = await userService.getUserById(targetUserId);
    
    const maskedNumber = generateMaskedPhone(user.phone);
    const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Call initiated', { from: req.user._id, to: targetUserId, callId });

    res.json(ApiResponse.success({
      maskedNumber,
      callId,
      validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000)
    }));
  } catch (error) {
    next(error);
  }
};

exports.getMaskedPhone = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.userId);
    const maskedNumber = generateMaskedPhone(user.phone);

    res.json(ApiResponse.success({
      maskedNumber,
      validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000)
    }));
  } catch (error) {
    next(error);
  }
};

exports.sosAlert = async (req, res, next) => {
  try {
    const { ridePoolId, message, location } = req.body;

    const alert = await sosService.createAlert(req.user._id, {
      ridePoolId,
      message,
      location
    });

    logger.error('SOS ALERT', {
      alertId: alert._id,
      userId: req.user._id,
      ridePoolId,
      message,
      location,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(ApiResponse.created({ alertId: alert._id }, 'SOS alert sent. Authorities have been notified.'));
  } catch (error) {
    next(error);
  }
};

exports.endCall = async (req, res, next) => {
  try {
    const { callId } = req.body;
    logger.info('Call ended', { callId, userId: req.user._id });
    res.json(ApiResponse.success(null, 'Call ended successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getSOSHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await sosService.getUserAlerts(req.user._id, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getPrivacySettings = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.json(ApiResponse.success({
      isProfileBlurred: user.isProfileBlurred,
      phoneVisibility: 'masked',
      showFullName: false,
      showLastName: false
    }));
  } catch (error) {
    next(error);
  }
};

exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const { isProfileBlurred } = req.body;
    const user = await userService.updateProfile(req.user._id, { isProfileBlurred });
    res.json(ApiResponse.success({
      isProfileBlurred: user.isProfileBlurred,
      firstName: user.firstName,
      lastName: user.isProfileBlurred ? null : user.lastName,
      profilePicture: user.profilePicture
    }, 'Privacy settings updated'));
  } catch (error) {
    next(error);
  }
};

exports.getProfileVisibility = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user._id);
    res.json(ApiResponse.success({
      firstName: user.firstName,
      lastName: user.isProfileBlurred ? null : user.lastName,
      profilePicture: user.profilePicture,
      isProfileBlurred: user.isProfileBlurred
    }));
  } catch (error) {
    next(error);
  }
};
