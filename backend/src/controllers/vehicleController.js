const { vehicleService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.create(req.user.id, req.body);
    res.status(201).json(ApiResponse.created({ vehicle }, 'Vehicle created successfully'));
  } catch (error) {
    next(error);
  }
};

exports.getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getMyVehicles(req.user.id);
    res.json(ApiResponse.success({ vehicles }));
  } catch (error) {
    next(error);
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    res.json(ApiResponse.success({ vehicle }));
  } catch (error) {
    next(error);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.user.id, req.body);
    res.json(ApiResponse.success({ vehicle }, 'Vehicle updated successfully'));
  } catch (error) {
    next(error);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id, req.user.id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getAllVehicles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive, search, brand, model, color } = req.query;
    const result = await vehicleService.getAllVehicles({ page, limit, isActive, search, brand, model, color });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.toggleVehicleStatus = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.toggleVehicleStatus(req.params.id, req.user.id);
    res.json(ApiResponse.success({ vehicle }));
  } catch (error) {
    next(error);
  }
};

exports.getVehiclesByDriver = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await vehicleService.getVehiclesByDriver(req.params.driverId, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};
