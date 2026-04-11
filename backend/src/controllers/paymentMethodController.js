const { paymentMethodService } = require('../services');
const { ApiResponse } = require('../dto/response/ApiResponse');

class PaymentMethodController {
  async addPaymentMethod(req, res, next) {
    try {
      const { userId } = req.user;
      const method = await paymentMethodService.addPaymentMethod(userId, req.body);
      const sanitized = paymentMethodService.sanitizeDetails(method);
      return ApiResponse.success(res, sanitized, 'Payment method added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyPaymentMethods(req, res, next) {
    try {
      const { userId } = req.user;
      const methods = await paymentMethodService.getActivePaymentMethods(userId);
      return ApiResponse.success(res, methods, 'Payment methods retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethod(req, res, next) {
    try {
      const { userId } = req.user;
      const { methodId } = req.params;
      const method = await paymentMethodService.getPaymentMethodById(parseInt(methodId), userId);
      const sanitized = paymentMethodService.sanitizeDetails(method);
      return ApiResponse.success(res, sanitized, 'Payment method retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updatePaymentMethod(req, res, next) {
    try {
      const { userId } = req.user;
      const { methodId } = req.params;
      const method = await paymentMethodService.updatePaymentMethod(parseInt(methodId), userId, req.body);
      const sanitized = paymentMethodService.sanitizeDetails(method);
      return ApiResponse.success(res, sanitized, 'Payment method updated');
    } catch (error) {
      next(error);
    }
  }

  async deletePaymentMethod(req, res, next) {
    try {
      const { userId } = req.user;
      const { methodId } = req.params;
      const result = await paymentMethodService.deletePaymentMethod(parseInt(methodId), userId);
      return ApiResponse.success(res, result, 'Payment method deleted');
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req, res, next) {
    try {
      const { userId } = req.user;
      const { methodId } = req.params;
      const method = await paymentMethodService.setDefault(parseInt(methodId), userId);
      const sanitized = paymentMethodService.sanitizeDetails(method);
      return ApiResponse.success(res, sanitized, 'Payment method set as default');
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const { userId } = req.user;
      const { methodId } = req.params;
      const method = await paymentMethodService.deactivatePaymentMethod(parseInt(methodId), userId);
      return ApiResponse.success(res, method, 'Payment method deactivated');
    } catch (error) {
      next(error);
    }
  }

  async reactivate(req, res, next) {
    try {
      const { userId } = req.user;
      const { methodId } = req.params;
      const method = await paymentMethodService.reactivatePaymentMethod(parseInt(methodId), userId);
      const sanitized = paymentMethodService.sanitizeDetails(method);
      return ApiResponse.success(res, sanitized, 'Payment method reactivated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentMethodController();
