const payoutService = require('../services/PayoutService');
const { ApiResponse, PaginatedResponse } = require('../dto');
const { ForbiddenException } = require('../exceptions');

exports.getDriverEarnings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const result = await payoutService.getDriverEarnings(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      status
    });
    res.json(PaginatedResponse.format({
      data: result.payouts,
      pagination: result.pagination,
      summary: result.summary
    }));
  } catch (error) {
    next(error);
  }
};

exports.getDriverEarningsSummary = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const summary = await payoutService.getEarningsSummary(req.user.id, period);
    res.json(ApiResponse.success({ summary }));
  } catch (error) {
    next(error);
  }
};

exports.getMyEarnings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const result = await payoutService.getDriverEarnings(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      status
    });
    res.json(PaginatedResponse.format({
      data: result.payouts,
      pagination: result.pagination,
      summary: result.summary
    }));
  } catch (error) {
    next(error);
  }
};

exports.getOwnerPayoutHistory = async (req, res, next) => {
  try {
    if (req.user.role !== 'OWNER') {
      throw ForbiddenException.requireRole('OWNER');
    }
    const { page = 1, limit = 10, startDate, endDate, status } = req.query;
    const result = await payoutService.getOwnerPayouts(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate,
      status
    });
    res.json(PaginatedResponse.format({
      data: result.payouts,
      pagination: result.pagination,
      summary: result.summary
    }));
  } catch (error) {
    next(error);
  }
};

exports.getPayoutStats = async (req, res, next) => {
  try {
    const { period = 'month' } = req.query;
    const summary = await payoutService.getEarningsSummary(req.user.id, period);
    res.json(ApiResponse.success({ stats: summary }));
  } catch (error) {
    next(error);
  }
};