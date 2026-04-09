class ApiResponse {
  static success(data, message = null) {
    const response = {
      status: 'success'
    };

    if (message) {
      response.message = message;
    }

    if (data !== undefined) {
      response.data = data;
    }

    return response;
  }

  static created(data, message = 'Created successfully') {
    return {
      status: 'success',
      message,
      data
    };
  }

  static error(message, errors = []) {
    const response = {
      status: 'error',
      message
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return response;
  }

  static paginated(items, total, page, limit, pages) {
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

  static unauthorized(message = 'Authentication required') {
    return {
      status: 'error',
      message
    };
  }

  static forbidden(message = 'Access denied') {
    return {
      status: 'error',
      message
    };
  }

  static notFound(message = 'Resource not found') {
    return {
      status: 'error',
      message
    };
  }

  static validationError(errors) {
    return {
      status: 'error',
      message: 'Validation failed',
      errors
    };
  }
}

module.exports = ApiResponse;
