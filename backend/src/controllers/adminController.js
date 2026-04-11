const adminService = require('../services/adminService');
const { driverDocumentService, vehicleDocumentService, ownerService, documentExpiryService, fleetService, ownerDocumentService } = require('../services');
const { ApiResponse, PaginatedResponse } = require('../dto/response/ApiResponse');

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      return ApiResponse.success(res, stats, 'Dashboard stats retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUserAnalytics(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const analytics = await adminService.getUserAnalytics(period);
      return ApiResponse.success(res, analytics, 'User analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getRideAnalytics(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const analytics = await adminService.getRideAnalytics(period);
      return ApiResponse.success(res, analytics, 'Ride analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalytics(req, res, next) {
    try {
      const { period = '30d' } = req.query;
      const analytics = await adminService.getRevenueAnalytics(period);
      return ApiResponse.success(res, analytics, 'Revenue analytics retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPopularRoutes(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const routes = await adminService.getPopularRoutes(parseInt(limit));
      return ApiResponse.success(res, { routes }, 'Popular routes retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPeakHours(req, res, next) {
    try {
      const peakHours = await adminService.getPeakHours();
      return ApiResponse.success(res, { peakHours }, 'Peak hours retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getAllUsers(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.users, result.pagination, 'Users retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;
      const user = await adminService.getUserDetails(parseInt(userId));
      return ApiResponse.success(res, user, 'User details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { isActive, reason } = req.body;
      const user = await adminService.updateUserStatus(parseInt(userId), isActive, reason);
      return ApiResponse.success(res, user, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async suspendUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const user = await adminService.suspendUser(parseInt(userId), reason);
      return ApiResponse.success(res, user, 'User suspended successfully');
    } catch (error) {
      next(error);
    }
  }

  async unsuspendUser(req, res, next) {
    try {
      const { userId } = req.params;
      const user = await adminService.unsuspendUser(parseInt(userId));
      return ApiResponse.success(res, user, 'User unsuspended successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(parseInt(userId));
      return ApiResponse.success(res, result, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllVehicles(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getAllVehicles(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.vehicles, result.pagination, 'Vehicles retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getVehicleDetails(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const vehicle = await adminService.getVehicleDetails(parseInt(vehicleId));
      return ApiResponse.success(res, vehicle, 'Vehicle details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateVehicleVerification(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { status } = req.body;
      const vehicle = await adminService.updateVehicleVerification(parseInt(vehicleId), status);
      return ApiResponse.success(res, vehicle, 'Vehicle verification updated');
    } catch (error) {
      next(error);
    }
  }

  async createVehicle(req, res, next) {
    try {
      const vehicle = await adminService.createVehicle(req.body);
      return ApiResponse.success(res, vehicle, 'Vehicle created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const vehicle = await adminService.updateVehicle(parseInt(vehicleId), req.body);
      return ApiResponse.success(res, vehicle, 'Vehicle updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteVehicle(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const result = await adminService.deleteVehicle(parseInt(vehicleId));
      return ApiResponse.success(res, result, 'Vehicle deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllRides(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getAllRides(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.rides, result.pagination, 'Rides retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getRideDetails(req, res, next) {
    try {
      const { rideId } = req.params;
      const ride = await adminService.getRideDetails(parseInt(rideId));
      return ApiResponse.success(res, ride, 'Ride details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async cancelRide(req, res, next) {
    try {
      const { rideId } = req.params;
      const { reason } = req.body;
      const ride = await adminService.cancelRide(parseInt(rideId), reason);
      return ApiResponse.success(res, ride, 'Ride cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllTrips(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getAllTrips(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.trips, result.pagination, 'Trips retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getTripDetails(req, res, next) {
    try {
      const { tripId } = req.params;
      const trip = await adminService.getTripDetails(parseInt(tripId));
      return ApiResponse.success(res, trip, 'Trip details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAllReviews(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getAllReviews(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.reviews, result.pagination, 'Reviews retrieved');
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const { reviewId } = req.params;
      const result = await adminService.deleteReview(parseInt(reviewId));
      return ApiResponse.success(res, result, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSOSAlerts(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getSOSAlerts(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.alerts, result.pagination, 'SOS alerts retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateSOSAlertStatus(req, res, next) {
    try {
      const { alertId } = req.params;
      const { status } = req.body;
      const alert = await adminService.updateSOSAlertStatus(parseInt(alertId), status);
      return ApiResponse.success(res, alert, 'SOS alert status updated');
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const result = await adminService.getMessages(parseInt(page), parseInt(limit), filters);
      return PaginatedResponse.success(res, result.messages, result.pagination, 'Messages retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPendingDriverDocuments(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await driverDocumentService.getPendingDocuments({ page: parseInt(page), limit: parseInt(limit) });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Pending driver documents retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getDriverDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const { userId, role } = req.user;
      const document = await driverDocumentService.getDocumentById(parseInt(documentId), userId, role);
      return ApiResponse.success(res, document, 'Driver document retrieved');
    } catch (error) {
      next(error);
    }
  }

  async verifyDriverDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const document = await driverDocumentService.verifyDocument(parseInt(documentId), userId, role);
      return ApiResponse.success(res, document, 'Driver document verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectDriverDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const { reason } = req.body;
      const document = await driverDocumentService.rejectDocument(parseInt(documentId), userId, role, reason);
      return ApiResponse.success(res, document, 'Driver document rejected');
    } catch (error) {
      next(error);
    }
  }

  async getPendingVehicleDocuments(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await vehicleDocumentService.getPendingDocuments({ page: parseInt(page), limit: parseInt(limit) });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Pending vehicle documents retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getVehicleDocument(req, res, next) {
    try {
      const { documentId } = req.params;
      const { userId, role } = req.user;
      const document = await vehicleDocumentService.getDocumentById(parseInt(documentId), userId, role);
      return ApiResponse.success(res, document, 'Vehicle document retrieved');
    } catch (error) {
      next(error);
    }
  }

  async verifyVehicleDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const document = await vehicleDocumentService.verifyDocument(parseInt(documentId), userId, role);
      return ApiResponse.success(res, document, 'Vehicle document verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectVehicleDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const { reason } = req.body;
      const document = await vehicleDocumentService.rejectDocument(parseInt(documentId), userId, role, reason);
      return ApiResponse.success(res, document, 'Vehicle document rejected');
    } catch (error) {
      next(error);
    }
  }

  async getAllOwners(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await ownerService.getAllOwners({ page: parseInt(page), limit: parseInt(limit) });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Owners retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPendingOwners(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await ownerService.getPendingOwners({ page: parseInt(page), limit: parseInt(limit) });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Pending owners retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getOwner(req, res, next) {
    try {
      const { ownerId } = req.params;
      const owner = await ownerService.getOwnerById(parseInt(ownerId));
      return ApiResponse.success(res, owner, 'Owner retrieved');
    } catch (error) {
      next(error);
    }
  }

  async verifyOwner(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { ownerId } = req.params;
      const owner = await ownerService.verifyOwner(parseInt(ownerId), userId, role);
      return ApiResponse.success(res, owner, 'Owner verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectOwner(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { ownerId } = req.params;
      const { reason } = req.body;
      const owner = await ownerService.rejectOwner(parseInt(ownerId), userId, role, reason);
      return ApiResponse.success(res, owner, 'Owner rejected');
    } catch (error) {
      next(error);
    }
  }

  async getExpiringDocuments(req, res, next) {
    try {
      const { days = 30 } = req.query;
      const result = await documentExpiryService.getExpiringDocuments(parseInt(days));
      return ApiResponse.success(res, result, 'Expiring documents retrieved');
    } catch (error) {
      next(error);
    }
  }

  async runDocumentExpiryCheck(req, res, next) {
    try {
      const result = await documentExpiryService.markExpiredDocuments();
      return ApiResponse.success(res, result, 'Document expiry check completed');
    } catch (error) {
      next(error);
    }
  }

  async getFleetPerformance(req, res, next) {
    try {
      const { ownerId, period = '30d' } = req.query;
      const { userId, role } = req.user;
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          message: 'ownerId is required'
        });
      }
      const result = await fleetService.getFleetPerformance(parseInt(ownerId), period, userId, role);
      return ApiResponse.success(res, result, 'Fleet performance retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getFleetVehicles(req, res, next) {
    try {
      const { ownerId, page = 1, limit = 20 } = req.query;
      const { userId, role } = req.user;
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          message: 'ownerId is required'
        });
      }
      const result = await fleetService.getFleetVehicles(parseInt(ownerId), {
        page: parseInt(page),
        limit: parseInt(limit)
      }, userId, role);
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

  async getPendingOwnerDocuments(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await ownerDocumentService.getPendingDocuments({ page: parseInt(page), limit: parseInt(limit) });
      return PaginatedResponse.success(res, result.items, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages
      }, 'Pending owner documents retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getOwnerDocumentById(req, res, next) {
    try {
      const { documentId } = req.params;
      const { userId, role } = req.user;
      const document = await ownerDocumentService.getDocumentById(parseInt(documentId), userId, role);
      return ApiResponse.success(res, document, 'Owner document retrieved');
    } catch (error) {
      next(error);
    }
  }

  async verifyOwnerDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const document = await ownerDocumentService.verifyDocument(parseInt(documentId), userId, role);
      return ApiResponse.success(res, document, 'Owner document verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async rejectOwnerDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const { reason } = req.body;
      const document = await ownerDocumentService.rejectDocument(parseInt(documentId), userId, role, reason);
      return ApiResponse.success(res, document, 'Owner document rejected');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
