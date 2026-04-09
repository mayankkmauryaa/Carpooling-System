const BaseService = require('./base/BaseService');
const { messageRepository, userRepository } = require('../repositories');
const { NotFoundException, ForbiddenException } = require('../exceptions');
const logger = require('../middleware/logger');

class MessageService extends BaseService {
  constructor() {
    super(messageRepository);
  }

  async getMessages(userId, options = {}) {
    const { userId: otherUserId, ridePoolId, page = 1, limit = 50 } = options;

    const messages = await this.repository.findConversation(userId, otherUserId, { page, limit });
    
    if (otherUserId) {
      await this.repository.markAsRead(otherUserId, userId);
    }

    return messages.reverse();
  }

  async getConversation(currentUserId, options = {}) {
    const { otherUserId, page = 1, limit = 50 } = options;
    return await this.repository.findConversation(currentUserId, otherUserId, { page, limit });
  }

  async getConversations(userId) {
    const conversations = await this.repository.getConversations(userId);

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const user = await userRepository.findById(conv._id, {
          select: 'firstName lastName profilePicture'
        });
        return {
          userId: conv._id,
          user,
          lastMessage: conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount: conv.unreadCount
        };
      })
    );

    return enrichedConversations;
  }

  async sendMessage(senderId, receiverId, content, ridePoolId = null) {
    const receiver = await userRepository.findById(receiverId);
    
    if (!receiver) {
      throw NotFoundException.user(receiverId);
    }

    const message = await this.repository.create({
      senderId,
      receiverId,
      ridePoolId,
      content
    });

    logger.info('Message sent', { messageId: message._id, from: senderId, to: receiverId });

    return message;
  }

  async markAsRead(userId, senderId) {
    await this.repository.markAsRead(senderId, userId);
    return { message: 'Messages marked as read' };
  }

  async getUnreadCount(userId) {
    const count = await this.repository.getUnreadCount(userId);
    return { unreadCount: count };
  }

  async deleteMessage(messageId, userId) {
    const message = await this.findById(messageId);
    
    if (!message) {
      throw NotFoundException.message(messageId);
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw ForbiddenException.notOwner();
    }

    await this.deleteById(messageId);

    return { message: 'Message deleted' };
  }

  async deleteConversation(userId, otherUserId) {
    await this.repository.deleteConversation(userId, otherUserId);
    return { message: 'Conversation deleted' };
  }
}

module.exports = new MessageService();
