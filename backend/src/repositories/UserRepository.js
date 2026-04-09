const { prisma } = require('../database/connection');

class UserRepository {
  async findById(id, options = {}) {
    const { include, select } = options;
    
    return await prisma.user.findUnique({
      where: { id },
      include: include || undefined,
      select: select || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include, select } = options;
    
    return await prisma.user.findFirst({
      where: query,
      include: include || undefined,
      select: select || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { 
      include, 
      select, 
      orderBy = { createdAt: 'desc' }, 
      skip = 0, 
      take = 20 
    } = options;
    
    return await prisma.user.findMany({
      where: query,
      include: include || undefined,
      select: select || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.user.count({ where: query });
  }

  async create(data) {
    return await prisma.user.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.user.update({
      where: { id },
      data,
      ...options
    });
  }

  async updateOne(query, data, options = {}) {
    return await prisma.user.updateFirst({
      where: query,
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.user.delete({ where: { id } });
  }

  async deleteOne(query) {
    return await prisma.user.delete({ where: query });
  }

  async exists(query) {
    const user = await prisma.user.findFirst({ where: query, select: { id: true } });
    return !!user;
  }

  async paginate(query = {}, options = {}) {
    const { 
      include, 
      select, 
      orderBy = { createdAt: 'desc' }, 
      page = 1, 
      limit = 20 
    } = options;
    
    const skip = (page - 1) * limit;
    const total = await this.count(query);
    
    const items = await prisma.user.findMany({
      where: query,
      include: include || undefined,
      select: select || undefined,
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

  async findByEmail(email) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findByEmailWithPassword(email) {
    return await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isGoogleUser: true
      }
    });
  }

  async toggleStatus(id) {
    const user = await this.findById(id);
    if (user) {
      return await this.updateById(id, { isActive: !user.isActive });
    }
    return null;
  }

  async updateRating(userId, rating, totalReviews) {
    return await this.updateById(userId, { rating, totalReviews });
  }

  async updateProfile(userId, updates) {
    const allowedFields = ['firstName', 'lastName', 'phone', 'profilePicture', 'isProfileBlurred'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });
    
    return await this.updateById(userId, filteredUpdates);
  }

  async findByGoogleId(googleId) {
    return await prisma.user.findUnique({ where: { googleId } });
  }
}

module.exports = new UserRepository();
