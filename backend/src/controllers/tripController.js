const { tripService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.getMyTrips = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const result = await tripService.getMyTrips(req.user._id, { status, page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user._id, req.user.role);
    res.json(ApiResponse.success({ trip }));
  } catch (error) {
    next(error);
  }
};

exports.startTrip = async (req, res, next) => {
  try {
    const trip = await tripService.startTrip(req.params.id, req.user._id);
    res.json(ApiResponse.success({ trip }, 'Trip started'));
  } catch (error) {
    next(error);
  }
};

exports.completeTrip = async (req, res, next) => {
  try {
    const { actualDistance, actualDuration, endLocation } = req.body;
    const trip = await tripService.completeTrip(req.params.id, req.user._id, {
      actualDistance,
      actualDuration,
      endLocation
    });
    res.json(ApiResponse.success({ trip }, 'Trip completed'));
  } catch (error) {
    next(error);
  }
};

exports.cancelTrip = async (req, res, next) => {
  try {
    const result = await tripService.cancelTrip(req.params.id, req.user._id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getAllTrips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const result = await tripService.getAllTrips({ page, limit, status, startDate, endDate });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripsByDriver = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await tripService.getTripsByDriver(req.params.driverId, { page, limit, status });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripsByRider = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await tripService.getTripsByRider(req.params.riderId, { page, limit, status });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripByRidePool = async (req, res, next) => {
  try {
    const trip = await tripService.getTripByRidePool(req.params.ridePoolId);
    res.json(ApiResponse.success({ trip }));
  } catch (error) {
    next(error);
  }
};

exports.getTripsByDate = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await tripService.getTripsByDate(req.params.date, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripsByStatus = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await tripService.getTripsByStatus(req.params.status, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingTrips = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await tripService.getUpcomingTrips(req.user._id, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getTripStats = async (req, res, next) => {
  try {
    const stats = await tripService.getTripStats();
    res.json(ApiResponse.success(stats));
  } catch (error) {
    next(error);
  }
};
