const { prisma } = require('../database/connection');

class OwnerDocumentRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.ownerDocument.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.ownerDocument.findFirst({
      where: query,
      include: include || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, skip = 0, take = 50 } = options;
    return await prisma.ownerDocument.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async create(data) {
    return await prisma.ownerDocument.create({ data });
  }

  async updateById(id, data) {
    return await prisma.ownerDocument.update({
      where: { id },
      data
    });
  }

  async deleteById(id) {
    return await prisma.ownerDocument.delete({ where: { id } });
  }

  async exists(query) {
    const doc = await prisma.ownerDocument.findFirst({ where: query, select: { id: true } });
    return !!doc;
  }

  async findByOwner(ownerId, options = {}) {
    return await this.findAll({ ownerId }, options);
  }

  async findByOwnerAndType(ownerId, documentType) {
    return await prisma.ownerDocument.findFirst({
      where: { ownerId, documentType }
    });
  }

  async findPendingDocuments(options = {}) {
    const { orderBy = { createdAt: 'asc' }, skip = 0, take = 50 } = options;
    return await prisma.ownerDocument.findMany({
      where: { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } },
      include: { owner: { include: { user: true } } },
      orderBy,
      skip,
      take
    });
  }

  async countPendingDocuments() {
    return await prisma.ownerDocument.count({
      where: { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } }
    });
  }

  async findExpiredDocuments() {
    return await prisma.ownerDocument.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'APPROVED'
      }
    });
  }

  async paginate(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const total = await prisma.ownerDocument.count({ where: query });
    
    const items = await prisma.ownerDocument.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take: limit
    });
    
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async markAsExpired(id) {
    return await this.updateById(id, { status: 'EXPIRED' });
  }

  async verifyDocument(id, verifiedBy) {
    return await this.updateById(id, {
      status: 'APPROVED',
      verifiedAt: new Date(),
      verifiedBy
    });
  }

  async rejectDocument(id, rejectedReason, verifiedBy) {
    return await this.updateById(id, {
      status: 'REJECTED',
      rejectedReason,
      verifiedBy
    });
  }
}

module.exports = new OwnerDocumentRepository();
