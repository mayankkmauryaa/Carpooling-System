const { prisma } = require('../database/connection');

class PaymentMethodRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.paymentMethod.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.paymentMethod.findFirst({
      where: query,
      include: include || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, skip = 0, take = 50 } = options;
    return await prisma.paymentMethod.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async create(data) {
    return await prisma.paymentMethod.create({ data });
  }

  async updateById(id, data) {
    return await prisma.paymentMethod.update({
      where: { id },
      data
    });
  }

  async deleteById(id) {
    return await prisma.paymentMethod.delete({ where: { id } });
  }

  async findByUser(userId) {
    return await prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });
  }

  async findDefault(userId) {
    return await prisma.paymentMethod.findFirst({
      where: { userId, isDefault: true }
    });
  }

  async exists(query) {
    const method = await prisma.paymentMethod.findFirst({ where: query, select: { id: true } });
    return !!method;
  }

  async clearDefaultForUser(userId) {
    return await prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false }
    });
  }

  async setAsDefault(id) {
    return await prisma.$transaction(async (tx) => {
      const method = await tx.paymentMethod.findUnique({ where: { id } });
      if (!method) return null;

      await tx.paymentMethod.updateMany({
        where: { userId: method.userId, isDefault: true },
        data: { isDefault: false }
      });

      return await tx.paymentMethod.update({
        where: { id },
        data: { isDefault: true }
      });
    });
  }

  async paginate(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const total = await prisma.paymentMethod.count({ where: query });
    
    const items = await prisma.paymentMethod.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take: limit
    });
    
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async deleteAllForUser(userId) {
    return await prisma.paymentMethod.deleteMany({
      where: { userId }
    });
  }
}

module.exports = new PaymentMethodRepository();
