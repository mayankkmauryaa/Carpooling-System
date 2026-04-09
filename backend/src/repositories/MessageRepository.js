const BaseRepository = require('./base/BaseRepository');
const Message = require('../models/Message');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  async findConversation(userId1, userId2, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    return await this.model.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);
  }

  async getConversations(userId) {
    return await this.model.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId'
            ]
          },
          lastMessage: { $first: '$content' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ]);
  }

  async markAsRead(senderId, receiverId) {
    return await this.model.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId) {
    return await this.count({ receiverId: userId, isRead: false });
  }

  async deleteConversation(userId1, userId2) {
    return await this.model.deleteMany({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    });
  }
}

module.exports = new MessageRepository();
