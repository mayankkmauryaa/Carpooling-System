const { messageService, userService, sosService } = require('../services');
const { generateMaskedPhone } = require('../utils/helpers');
const logger = require('../middleware/logger');
const { ApiResponse, PaginatedResponse } = require('../dto');

const MASKED_CALL_VALIDITY_HOURS = parseInt(process.env.MASKED_CALL_VALIDITY_HOURS) || 2;

exports.initiateCall = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json(ApiResponse.error('targetUserId is required'));
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json(ApiResponse.error('Cannot initiate call with yourself'));
    }

    const user = await userService.getUserById(targetUserId);
    
    if (!user) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }

    if (!user.phone) {
      return res.status(400).json(ApiResponse.error('User has no phone number on record'));
    }

    const maskedNumber = generateMaskedPhone(user.phone);
    const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const validUntil = new Date(Date.now() + MASKED_CALL_VALIDITY_HOURS * 60 * 60 * 1000);

    // TODO [VoIP]: Integrate with Twilio/Exotel for actual call routing
    // Implementation steps:
    // 1. Create Twilio client: const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // 2. Create outbound call: await twilio.calls.create({ to: user.phone, from: process.env.TWILIO_PHONE_NUMBER, url: `${APP_URL}/api/v1/privacy/call/twiml` });
    // 3. Store call session in database with validUntil
    // 4. Return actual call status from Twilio
    // 
    // Example Twilio integration:
    // const call = await twilio.calls.create({
    //   to: user.phone,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   url: `${process.env.APP_URL}/api/v1/privacy/call/twiml?callId=${callId}&callerId=${req.user.id}`
    // });
    // return ApiResponse.success({ callId, callSid: call.sid, status: call.status, validUntil });

    logger.info('Call initiated', { from: req.user.id, to: targetUserId, callId });

    res.json(ApiResponse.success({
      maskedNumber,
      callId,
      validUntil
    }));
  } catch (error) {
    next(error);
  }
};

exports.getMaskedPhone = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json(ApiResponse.error('Invalid user ID'));
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json(ApiResponse.error('User not found'));
    }

    const maskedNumber = generateMaskedPhone(user.phone);
    const validUntil = new Date(Date.now() + MASKED_CALL_VALIDITY_HOURS * 60 * 60 * 1000);

    res.json(ApiResponse.success({
      maskedNumber,
      validUntil
    }));
  } catch (error) {
    next(error);
  }
};

exports.sosAlert = async (req, res, next) => {
  try {
    const { ridePoolId, message, location } = req.body;

    if (ridePoolId !== undefined) {
      const parsedRidePoolId = parseInt(ridePoolId);
      if (isNaN(parsedRidePoolId)) {
        return res.status(400).json(ApiResponse.error('Invalid ridePoolId'));
      }
    }

    if (location) {
      if (typeof location !== 'object') {
        return res.status(400).json(ApiResponse.error('Invalid location format'));
      }
      if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return res.status(400).json(ApiResponse.error('Invalid location: latitude and longitude must be numbers'));
      }
      if (location.latitude < -90 || location.latitude > 90) {
        return res.status(400).json(ApiResponse.error('Invalid latitude: must be between -90 and 90'));
      }
      if (location.longitude < -180 || location.longitude > 180) {
        return res.status(400).json(ApiResponse.error('Invalid longitude: must be between -180 and 180'));
      }
    }

    const alert = await sosService.createAlert(req.user.id, {
      ridePoolId: ridePoolId ? parseInt(ridePoolId) : undefined,
      message,
      location
    });

    logger.warn('SOS ALERT triggered', {
      alertId: alert.id,
      userId: req.user.id,
      ridePoolId,
      message,
      location,
      timestamp: new Date().toISOString()
    });

    res.status(201).json(ApiResponse.created({ alertId: alert.id }, 'SOS alert sent. Authorities have been notified.'));
  } catch (error) {
    next(error);
  }
};

exports.endCall = async (req, res, next) => {
  try {
    const { callId } = req.body;

    if (!callId) {
      return res.status(400).json(ApiResponse.error('callId is required'));
    }

    if (typeof callId !== 'string' || callId.length < 5) {
      return res.status(400).json(ApiResponse.error('Invalid callId format'));
    }

    // TODO [VoIP]: Integrate with Twilio/Exotel for actual call termination
    // Implementation steps:
    // 1. Retrieve call session from database using callId
    // 2. If Twilio integration: await twilio.calls(callSid).update({ status: 'completed' });
    // 3. Update call session in database with endedAt timestamp
    // 4. Log call duration and any issues
    //
    // Example Twilio termination:
    // const callSession = await prisma.callSession.findUnique({ where: { callId } });
    // if (callSession && callSession.twilioCallSid) {
    //   await twilio.calls(callSession.twilioCallSid).update({ status: 'completed' });
    // }
    // await prisma.callSession.update({ where: { callId }, data: { endedAt: new Date() } });

    logger.info('Call ended', { callId, userId: req.user.id });
    res.json(ApiResponse.success(null, 'Call ended successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getSOSHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await sosService.getUserAlerts(req.user.id, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getPrivacySettings = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
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
    const user = await userService.updateProfile(req.user.id, { isProfileBlurred });
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
    const user = await userService.getProfile(req.user.id);
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
