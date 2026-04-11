const { fleetService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto/response/ApiResponse');

class FleetController {
  async getFleetProfile(req, res, next) {
    try {
      const { userId } = req.user;
      const profile = await fleetService.getFleetProfile(userId);
      return ApiResponse.success(res, profile, 'Fleet profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getFleetVehicles(req, res, next) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20 } = req.query;
      const result = await fleetService.getFleetVehicles(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Fleet vehicles retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getFleetDrivers(req, res, next) {
    try {
      const { userId } = req.user;
      const { page = 1, limit = 20 } = req.query;
      const result = await fleetService.getFleetDrivers(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Fleet drivers retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getFleetStats(req, res, next) {
    try {
      const { userId } = req.user;
      const stats = await fleetService.getFleetStats(userId);
      return ApiResponse.success(res, stats, 'Fleet stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getVehicleUtilization(req, res, next) {
    try {
      const { userId } = req.user;
      const { days = 30 } = req.query;
      const utilization = await fleetService.getVehicleUtilization(userId, parseInt(days));
      return ApiResponse.success(res, utilization, 'Vehicle utilization retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPerformance(req, res, next) {
    try {
      const { userId } = req.user;
      const { period = '30d' } = req.query;
      const performance = await fleetService.getFleetPerformance(userId, period);
      return ApiResponse.success(res, performance, 'Fleet performance retrieved');
    } catch (error) {
      next(error);
    }
  }

  async assignDriver(req, res, next) {
    try {
      const { userId } = req.user;
      const { vehicleId, driverId } = req.body;
      const result = await fleetService.assignDriverToVehicle(userId, vehicleId, driverId);
      return ApiResponse.success(res, result, 'Driver assigned to vehicle');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FleetController();
