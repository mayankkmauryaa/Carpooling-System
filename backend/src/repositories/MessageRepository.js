const { prisma } = require('../database/connection');

class MessageRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.message.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.message.findFirst({
      where: query,
      include: include || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { 
      include, 
      orderBy = { createdAt: 'desc' }, 
      skip = 0, 
      take = 20 
    } = options;
    
    return await prisma.message.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.message.count({ where: query });
  }

  async create(data) {
    return await prisma.message.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.message.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.message.delete({ where: { id } });
  }

  async deleteMany(query) {
    return await prisma.message.deleteMany({ where: query });
  }

  async paginate(query = {}, options = {}) {
    const { 
      include, 
      orderBy = { createdAt: 'desc' }, 
      page = 1, 
      limit = 20 
    } = options;
    
    const skip = (page - 1) * limit;
    const total = await this.count(query);
    
    const items = await prisma.message.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take: limit
    });
    
    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  async findConversation(userId1, userId2, options = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });
  }

  async getConversations(userId) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      orderBy: { createdAt: 'desc' }
    });

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0
        });
      }

      if (msg.receiverId === userId && !msg.isRead) {
        const conv = conversationsMap.get(otherUserId);
        conv.unreadCount++;
      }
    }

    return Array.from(conversationsMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );
  }

  async markAsRead(senderId, receiverId) {
    return await prisma.message.updateMany({
      where: { senderId, receiverId, isRead: false },
      data: { isRead: true }
    });
  }

  async getUnreadCount(userId) {
    return await this.count({ receiverId: userId, isRead: false });
  }

  async deleteConversation(userId1, userId2) {
    return await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      }
    });
  }
}

module.exports = new MessageRepository();
