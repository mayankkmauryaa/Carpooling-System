const { ownerService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto/response/ApiResponse');

class OwnerController {
  async register(req, res, next) {
    try {
      const { userId } = req.user;
      const owner = await ownerService.registerAsOwner(userId, req.body);
      return ApiResponse.success(res, owner, 'Registered as owner successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyProfile(req, res, next) {
    try {
      const { userId } = req.user;
      const owner = await ownerService.getMyOwnerProfile(userId);
      return ApiResponse.success(res, owner, 'Owner profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { userId } = req.user;
      const owner = await ownerService.updateOwnerProfile(userId, req.body);
      return ApiResponse.success(res, owner, 'Owner profile updated');
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const { userId } = req.user;
      const dashboard = await ownerService.getOwnerDashboard(userId);
      return ApiResponse.success(res, dashboard, 'Dashboard data retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OwnerController();
