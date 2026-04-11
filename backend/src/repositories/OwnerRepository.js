const { prisma } = require('../database/connection');

class OwnerRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.owner.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.owner.findFirst({
      where: query,
      include: include || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, skip = 0, take = 50 } = options;
    return await prisma.owner.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async create(data) {
    return await prisma.owner.create({ data });
  }

  async updateById(id, data) {
    return await prisma.owner.update({
      where: { id },
      data
    });
  }

  async updateOne(query, data) {
    const owner = await prisma.owner.findFirst({ where: query });
    if (!owner) return null;
    return await prisma.owner.update({
      where: { id: owner.id },
      data
    });
  }

  async deleteById(id) {
    return await prisma.owner.delete({ where: { id } });
  }

  async findByUserId(userId) {
    return await prisma.owner.findUnique({
      where: { userId },
      include: { user: true }
    });
  }

  async exists(query) {
    const owner = await prisma.owner.findFirst({ where: query, select: { id: true } });
    return !!owner;
  }

  async paginate(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const total = await prisma.owner.count({ where: query });
    
    const items = await prisma.owner.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take: limit
    });
    
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findPendingVerification(options = {}) {
    const { orderBy = { createdAt: 'asc' }, skip = 0, take = 50 } = options;
    return await prisma.owner.findMany({
      where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: { user: true },
      orderBy,
      skip,
      take
    });
  }

  async updateVerificationStatus(id, status) {
    return await this.updateById(id, { verificationStatus: status });
  }
}

module.exports = new OwnerRepository();
