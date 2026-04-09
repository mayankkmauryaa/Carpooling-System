class PaginatedResponse {
  static format(paginatedResult) {
    const { items, total, page, limit, pages } = paginatedResult;

    return {
      status: 'success',
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1
        }
      }
    };
  }

  static formatSimple(items, total, page, limit) {
    const pages = Math.ceil(total / limit);

    return {
      status: 'success',
      data: {
        items,
        total,
        page: parseInt(page),
        pages
      }
    };
  }
}

module.exports = PaginatedResponse;
