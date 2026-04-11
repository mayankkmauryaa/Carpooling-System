const { prisma } = require('../database/connection');

class DriverDocumentRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.driverDocument.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.driverDocument.findFirst({
      where: query,
      include: include || undefined
    });
  }

  async findAll(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, skip = 0, take = 50 } = options;
    return await prisma.driverDocument.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async create(data) {
    return await prisma.driverDocument.create({ data });
  }

  async updateById(id, data) {
    return await prisma.driverDocument.update({
      where: { id },
      data
    });
  }

  async deleteById(id) {
    return await prisma.driverDocument.delete({ where: { id } });
  }

  async exists(query) {
    const doc = await prisma.driverDocument.findFirst({ where: query, select: { id: true } });
    return !!doc;
  }

  async findByDriver(driverId, options = {}) {
    return await this.findAll({ driverId }, options);
  }

  async findByDriverAndType(driverId, documentType) {
    return await prisma.driverDocument.findFirst({
      where: { driverId, documentType }
    });
  }

  async findPendingDocuments(options = {}) {
    const { orderBy = { createdAt: 'asc' }, skip = 0, take = 50 } = options;
    return await prisma.driverDocument.findMany({
      where: { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } },
      include: { driver: true },
      orderBy,
      skip,
      take
    });
  }

  async countPendingDocuments() {
    return await prisma.driverDocument.count({
      where: { status: { in: ['PENDING', 'UPLOADED', 'UNDER_REVIEW'] } }
    });
  }

  async findExpiredDocuments() {
    return await prisma.driverDocument.findMany({
      where: {
        expiresAt: { lt: new Date() },
        status: 'APPROVED'
      }
    });
  }

  async paginate(query = {}, options = {}) {
    const { include, orderBy = { createdAt: 'desc' }, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const total = await prisma.driverDocument.count({ where: query });
    
    const items = await prisma.driverDocument.findMany({
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

module.exports = new DriverDocumentRepository();
