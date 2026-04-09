const { prisma } = require('../database/connection');

class ReviewRepository {
  async findById(id, options = {}) {
    const { include } = options;
    return await prisma.review.findUnique({
      where: { id },
      include: include || undefined
    });
  }

  async findOne(query, options = {}) {
    const { include } = options;
    return await prisma.review.findFirst({
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
    
    return await prisma.review.findMany({
      where: query,
      include: include || undefined,
      orderBy,
      skip,
      take
    });
  }

  async count(query = {}) {
    return await prisma.review.count({ where: query });
  }

  async create(data) {
    return await prisma.review.create({ data });
  }

  async updateById(id, data, options = {}) {
    return await prisma.review.update({
      where: { id },
      data,
      ...options
    });
  }

  async deleteById(id) {
    return await prisma.review.delete({ where: { id } });
  }

  async exists(query) {
    const review = await prisma.review.findFirst({ where: query, select: { id: true } });
    return !!review;
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
    
    const items = await prisma.review.findMany({
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

  async findByTrip(tripId) {
    return await this.findAll({ tripId, isVisible: true });
  }

  async findByReviewer(reviewerId, options = {}) {
    return await this.findAll({ reviewerId }, {
      ...options,
      include: { reviewee: true, trip: true }
    });
  }

  async findByReviewee(revieweeId, options = {}) {
    return await this.findAll({ revieweeId, isVisible: true }, {
      ...options,
      include: { reviewer: true, trip: true }
    });
  }

  async hasReviewed(tripId, reviewerId) {
    return await this.exists({ tripId, reviewerId });
  }

  async calculateAverageRating(revieweeId) {
    const result = await prisma.review.aggregate({
      where: { revieweeId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true }
    });

    if (result._count.rating === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    return {
      averageRating: Math.round((result._avg.rating || 0) * 10) / 10,
      totalReviews: result._count.rating
    };
  }

  async getRatingDistribution(revieweeId) {
    const reviews = await prisma.review.findMany({
      where: { revieweeId, isVisible: true },
      select: { rating: true }
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    for (const review of reviews) {
      if (distribution[review.rating] !== undefined) {
        distribution[review.rating]++;
      }
    }

    return distribution;
  }

  async getUserReviewsPaginated(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId, isVisible: true },
        include: {
          reviewer: { select: { firstName: true, lastName: true, profilePicture: true } },
          trip: { select: { startTime: true, startLocation: true, dropLocation: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.count({ revieweeId: userId, isVisible: true })
    ]);

    return {
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    };
  }
}

module.exports = new ReviewRepository();
