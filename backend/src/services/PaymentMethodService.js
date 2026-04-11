const BaseService = require('./base/BaseService');
const { paymentMethodRepository } = require('../repositories');
const { NotFoundException, ForbiddenException, BadRequestException } = require('../exceptions');
const logger = require('../middleware/logger');

const PAYMENT_METHOD_TYPES = {
  CARD: 'CARD',
  UPI: 'UPI',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  WALLET: 'WALLET',
  CASH: 'CASH'
};

class PaymentMethodService extends BaseService {
  constructor() {
    super(paymentMethodRepository);
  }

  async addPaymentMethod(userId, methodData) {
    const { type, details, isDefault } = methodData;

    if (!Object.values(PAYMENT_METHOD_TYPES).includes(type)) {
      throw BadRequestException(`Invalid payment method type. Must be one of: ${Object.values(PAYMENT_METHOD_TYPES).join(', ')}`);
    }

    if (isDefault) {
      await this.repository.clearDefaultForUser(userId);
    }

    const method = await this.repository.create({
      userId,
      type,
      details,
      isDefault: isDefault || false,
      status: 'ACTIVE'
    });

    logger.info('Payment method added', { userId, methodId: method.id, type });
    return method;
  }

  async getMyPaymentMethods(userId) {
    return await this.repository.findByUser(userId);
  }

  async getPaymentMethodById(methodId, userId) {
    const method = await this.repository.findById(methodId);
    
    if (!method) {
      throw NotFoundException('Payment method', methodId);
    }

    if (method.userId !== userId) {
      throw ForbiddenException.notOwner();
    }

    return method;
  }

  async updatePaymentMethod(methodId, userId, updates) {
    const method = await this.getPaymentMethodById(methodId, userId);

    if (updates.isDefault) {
      await this.repository.clearDefaultForUser(userId);
    }

    const { isDefault, details, status } = updates;
    const updated = await this.repository.updateById(methodId, {
      ...(details && { details }),
      ...(status && { status }),
      ...(isDefault !== undefined && { isDefault })
    });

    logger.info('Payment method updated', { methodId, userId });
    return updated;
  }

  async deletePaymentMethod(methodId, userId) {
    const method = await this.getPaymentMethodById(methodId, userId);

    await this.repository.deleteById(methodId);
    logger.info('Payment method deleted', { methodId, userId });

    if (method.isDefault) {
      const remaining = await this.repository.findByUser(userId);
      if (remaining.length > 0) {
        await this.repository.setAsDefault(remaining[0].id);
      }
    }

    return { message: 'Payment method deleted successfully' };
  }

  async setDefault(methodId, userId) {
    const method = await this.getPaymentMethodById(methodId, userId);

    if (method.status !== 'ACTIVE') {
      throw BadRequestException('Cannot set inactive payment method as default');
    }

    const updated = await this.repository.setAsDefault(methodId);
    logger.info('Payment method set as default', { methodId, userId });
    return updated;
  }

  async getDefaultPaymentMethod(userId) {
    let method = await this.repository.findDefault(userId);
    
    if (!method) {
      const methods = await this.repository.findByUser(userId);
      if (methods.length > 0) {
        method = methods[0];
      }
    }

    return method;
  }

  async deactivatePaymentMethod(methodId, userId) {
    const method = await this.getPaymentMethodById(methodId, userId);

    if (method.isDefault) {
      throw BadRequestException('Cannot deactivate default payment method. Set another as default first.');
    }

    const updated = await this.repository.updateById(methodId, { status: 'INACTIVE' });
    logger.info('Payment method deactivated', { methodId, userId });
    return updated;
  }

  async reactivatePaymentMethod(methodId, userId) {
    const method = await this.getPaymentMethodById(methodId, userId);

    const updated = await this.repository.updateById(methodId, { status: 'ACTIVE' });
    logger.info('Payment method reactivated', { methodId, userId });
    return updated;
  }

  sanitizeDetails(method) {
    if (!method.details) return method;
    
    const sanitized = { ...method.details };
    
    if (sanitized.cardNumber) {
      sanitized.cardNumber = `****${sanitized.cardNumber.slice(-4)}`;
    }
    if (sanitized.accountNumber) {
      sanitized.accountNumber = `****${sanitized.accountNumber.slice(-4)}`;
    }
    if (sanitized.ifsc) {
      sanitized.ifsc = sanitized.ifsc.toUpperCase();
    }

    return { ...method, details: sanitized };
  }

  async getActivePaymentMethods(userId) {
    const methods = await this.repository.findAll({
      userId,
      status: 'ACTIVE'
    });
    return methods.map(m => this.sanitizeDetails(m));
  }
}

module.exports = {
  paymentMethodService: new PaymentMethodService(),
  PAYMENT_METHOD_TYPES
};
