const { rideService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.createRide = async (req, res, next) => {
  try {
    const ride = await rideService.create(req.user._id, req.body);
    res.status(201).json(ApiResponse.created({ ride }, 'Ride created successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getMyRides = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const result = await rideService.getMyRides(req.user._id, { status, page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getRideById = async (req, res, next) => {
  try {
    const ride = await rideService.getRideById(req.params.id);
    res.json(ApiResponse.success({ ride }));
  } catch (error) {
    next(error);
  }
};

exports.updateRide = async (req, res, next) => {
  try {
    const ride = await rideService.updateRide(req.params.id, req.user._id, req.body);
    res.json(ApiResponse.success({ ride }, 'Ride updated successfully'));
  } catch (error) {
    next(error);
  }
};

exports.cancelRide = async (req, res, next) => {
  try {
    const result = await rideService.cancelRide(req.params.id, req.user._id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getRideRequests = async (req, res, next) => {
  try {
    const requests = await rideService.getRideRequests(req.params.id);
    res.json(ApiResponse.success({ requests }));
  } catch (error) {
    next(error);
  }
};

exports.respondToRequest = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const result = await rideService.respondToRequest(req.params.id, req.user._id, req.params.riderId, action, reason);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.searchRides = async (req, res, next) => {
  try {
    const result = await rideService.searchRides(req.query);
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await rideService.getRecommendations();
    res.json(ApiResponse.success({ recommendations }));
  } catch (error) {
    next(error);
  }
};

exports.requestToJoin = async (req, res, next) => {
  try {
    const result = await rideService.requestToJoin(req.params.id, req.user._id, req.body);
    res.status(201).json(ApiResponse.created(result, 'Join request sent'));
  } catch (error) {
    next(error);
  }
};

exports.getMyRequests = async (req, res, next) => {
  try {
    const requests = await rideService.getMyRequests(req.user._id);
    res.json(ApiResponse.success({ requests }));
  } catch (error) {
    next(error);
  }
};

exports.cancelJoinRequest = async (req, res, next) => {
  try {
    const result = await rideService.cancelJoinRequest(req.params.id, req.user._id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.updateRideStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const ride = await rideService.updateRideStatus(req.params.id, status);
    res.json(ApiResponse.success({ ride }));
  } catch (error) {
    next(error);
  }
};

exports.getRidesByDriver = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const result = await rideService.getRidesByDriver(req.params.driverId, { page, limit, status });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getRidesByDate = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await rideService.getRidesByDate(req.params.date, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingRides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await rideService.getUpcomingRides({ page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getNearbyRides = async (req, res, next) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    const rides = await rideService.getNearbyRides(lat, lng, radius);
    res.json(ApiResponse.success({ rides }));
  } catch (error) {
    next(error);
  }
};

exports.getAllRides = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, minSeats, maxPrice } = req.query;
    const result = await rideService.searchRides({ ...req.query, page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};
