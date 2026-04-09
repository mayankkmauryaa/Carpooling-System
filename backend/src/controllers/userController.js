const { userService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(ApiResponse.success({ user }));
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(ApiResponse.success({ user }, 'Profile updated successfully'));
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(ApiResponse.success({ user }));
  } catch (error) {
    next(error);
  }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await userService.getUserReviews(req.params.userId, { page, limit });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const result = await userService.getAllUsers({ page, limit, role, search });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getAllDrivers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;
    const result = await userService.getDrivers({ page, limit, isActive, search });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.getAllRiders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive, search } = req.query;
    const result = await userService.getRiders({ page, limit, isActive, search });
    res.json(PaginatedResponse.format(result));
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id);
    res.json(ApiResponse.success({ user }));
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
};
