const { prisma } = require('../database/connection');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    const { include, select, where } = options;
    
    const query = {
      where: where || { id: parseInt(id) },
    };

    if (include) {
      query.include = include;
    }

    if (select) {
      query.select = select;
    }

    return await prisma[this.model].findUnique(query);
  }

  async findOne(query, options = {}) {
    const { include, select, where } = options;
    
    const prismaQuery = {
      where: where || query,
    };

    if (include) {
      prismaQuery.include = include;
    }

    if (select) {
      prismaQuery.select = select;
    }

    return await prisma[this.model].findFirst(prismaQuery);
  }

  async findAll(query = {}, options = {}) {
    const { 
      include, 
      select, 
      orderBy = { createdAt: 'desc' }, 
      skip = 0, 
      take = 20,
      where 
    } = options;

    const prismaQuery = {
      where: where || query,
      orderBy,
      skip,
      take,
    };

    if (include) {
      prismaQuery.include = include;
    }

    if (select) {
      prismaQuery.select = select;
    }

    return await prisma[this.model].findMany(prismaQuery);
  }

  async count(query = {}) {
    return await prisma[this.model].count({ where: query });
  }

  async create(data) {
    return await prisma[this.model].create({ data });
  }

  async updateById(id, data, options = {}) {
    const { new: isNew = true, where } = options;
    return await prisma[this.model].update({
      where: where || { id: parseInt(id) },
      data,
    });
  }

  async updateOne(query, data, options = {}) {
    const { new: isNew = true, where } = options;
    return await prisma[this.model].update({
      where: where || query,
      data,
    });
  }

  async deleteById(id) {
    return await prisma[this.model].delete({
      where: { id: parseInt(id) },
    });
  }

  async deleteOne(query) {
    return await prisma[this.model].deleteMany({ where: query });
  }

  async exists(query) {
    const doc = await prisma[this.model].findFirst({
      where: query,
      select: { id: true },
    });
    return !!doc;
  }

  async paginate(query = {}, options = {}) {
    const { 
      include, 
      select, 
      orderBy = { createdAt: 'desc' }, 
      page = 1, 
      limit = 20,
      where 
    } = options;

    const skip = (page - 1) * limit;
    const prismaQuery = {
      where: where || query,
      orderBy,
      skip,
      take: limit,
    };

    if (include) {
      prismaQuery.include = include;
    }

    if (select) {
      prismaQuery.select = select;
    }

    const [items, total] = await Promise.all([
      prisma[this.model].findMany(prismaQuery),
      prisma[this.model].count({ where: where || query }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async updateMany(query, data) {
    return await prisma[this.model].updateMany({
      where: query,
      data,
    });
  }
}

module.exports = BaseRepository;
