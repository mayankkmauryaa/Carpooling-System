const Message = require('../models/Message');

exports.getMessages = async (req, res, next) => {
  try {
    const { userId, ridePoolId, page = 1, limit = 50 } = req.query;

    const query = {
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    };

    if (ridePoolId) {
      query.ridePoolId = ridePoolId;
    }

    const messages = await Message.find(query)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      status: 'success',
      data: {
        messages: messages.reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', req.user._id] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      }
    ]);

    const conversations = await Promise.all(
      messages.map(async (m) => {
        const User = require('../models/User');
        const user = await User.findById(m._id).select('firstName lastName profilePicture');
        return {
          userId: m._id,
          user,
          lastMessage: m.lastMessage,
          lastMessageAt: m.lastMessageAt,
          unreadCount: m.unreadCount
        };
      })
    );

    res.json({
      status: 'success',
      data: {
        conversations
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { userId } = req.body;

    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      status: 'success',
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });

    res.json({
      status: 'success',
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getConversationByUser = async (req, res, next) => {
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

    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

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

exports.sendNewMessage = async (req, res, next) => {
  try {
    const { receiverId, ridePoolId, content } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      ridePoolId,
      content
    });

    res.status(201).json({
      status: 'success',
      data: {
        message
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.markConversationAsRead = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { senderId: userId, receiverId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      status: 'success',
      message: 'Conversation marked as read'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        status: 'error',
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.json({
      status: 'success',
      message: 'Message deleted'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await Message.deleteMany({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id }
      ]
    });

    res.json({
      status: 'success',
      message: 'Conversation deleted'
    });
  } catch (error) {
    next(error);
  }
};
