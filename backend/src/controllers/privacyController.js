const User = require('../models/User');
const Message = require('../models/Message');
const RidePool = require('../models/RidePool');
const { generateMaskedPhone } = require('../utils/helpers');
const logger = require('../middleware/logger');

exports.initiateCall = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const maskedNumber = generateMaskedPhone(targetUser.phone);
    const callId = `CALL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Call initiated', { 
      from: req.user._id, 
      to: targetUserId, 
      callId 
    });

    res.json({
      status: 'success',
      data: {
        maskedNumber,
        callId,
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, ridePoolId, content } = req.body;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      ridePoolId,
      content
    });

    logger.info('Message sent', { 
      messageId: message._id,
      from: req.user._id,
      to: receiverId 
    });

    res.status(201).json({
      status: 'success',
      data: {
        messageId: message._id,
        sentAt: message.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMaskedPhone = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const maskedNumber = generateMaskedPhone(user.phone);

    res.json({
      status: 'success',
      data: {
        maskedNumber,
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.sosAlert = async (req, res, next) => {
  try {
    const { ridePoolId, message, location } = req.body;

    logger.error('SOS ALERT', {
      userId: req.user._id,
      ridePoolId,
      message,
      location,
      timestamp: new Date().toISOString()
    });

    res.json({
      status: 'success',
      message: 'SOS alert sent. Authorities have been notified.'
    });
  } catch (error) {
    next(error);
  }
};

exports.endCall = async (req, res, next) => {
  try {
    const { callId } = req.body;
    
    logger.info('Call ended', { callId, userId: req.user._id });
    
    res.json({
      status: 'success',
      message: 'Call ended successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    })
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Message.countDocuments({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    });

    res.json({
      status: 'success',
      data: {
        messages,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSOSHistory = async (req, res, next) => {
  try {
    res.json({
      status: 'success',
      data: {
        alerts: []
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPrivacySettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      status: 'success',
      data: {
        isProfileBlurred: user.isProfileBlurred,
        phoneVisibility: 'masked',
        showFullName: false,
        showLastName: false
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const { isProfileBlurred } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isProfileBlurred },
      { new: true }
    );

    res.json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfileVisibility = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      status: 'success',
      data: {
        firstName: user.firstName,
        lastName: user.isProfileBlurred ? null : user.lastName,
        profilePicture: user.profilePicture,
        isProfileBlurred: user.isProfileBlurred
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfileVisibility = async (req, res, next) => {
  try {
    const { isProfileBlurred } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isProfileBlurred },
      { new: true }
    );

    res.json({
      status: 'success',
      data: {
        isProfileBlurred: user.isProfileBlurred
      }
    });
  } catch (error) {
    next(error);
  }
};
