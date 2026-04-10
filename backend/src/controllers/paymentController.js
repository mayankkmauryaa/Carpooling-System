const paymentService = require('../services/paymentService');
const { ApiResponse, PaginatedResponse } = require('../dto/response/ApiResponse');
const { BadRequestException } = require('../exceptions');

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const { amount, currency = 'INR', tripId, vehicleId } = req.body;
      const userId = req.user.id;

      if (!amount || amount <= 0) {
        throw new BadRequestException('Invalid amount');
      }

      const order = await paymentService.createOrder(amount, currency, {
        userId,
        tripId,
        vehicleId,
        receipt: `RIDE_${tripId || 'MISC'}_${Date.now()}`
      });

      return ApiResponse.success(res, {
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }, 'Order created successfully');
    } catch (error) {
      next(error);
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const isValid = await paymentService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        throw new BadRequestException('Invalid payment signature');
      }

      return ApiResponse.success(res, { verified: true }, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async capturePayment(req, res, next) {
    try {
      const { paymentId, amount, currency = 'INR' } = req.body;

      const result = await paymentService.capturePayment(paymentId, amount, { currency });

      return ApiResponse.success(res, result, 'Payment captured successfully');
    } catch (error) {
      next(error);
    }
  }

  async refundPayment(req, res, next) {
    try {
      const { paymentId, amount } = req.body;

      const result = await paymentService.refundPayment(paymentId, amount);

      return ApiResponse.success(res, result, 'Refund initiated successfully');
    } catch (error) {
      next(error);
    }
  }

  async getPaymentDetails(req, res, next) {
    try {
      const { paymentId } = req.params;

      const payment = await paymentService.fetchPayment(paymentId);

      return ApiResponse.success(res, payment, 'Payment details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req, res, next) {
    try {
      const { email, name, phone } = req.body;
      const userId = req.user.id;

      const customer = await paymentService.createCustomer(email, name, {
        userId,
        phone
      });

      return ApiResponse.success(res, customer, 'Customer created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getCustomer(req, res, next) {
    try {
      const { customerId } = req.params;

      const customer = await paymentService.getCustomer(customerId);

      return ApiResponse.success(res, customer, 'Customer retrieved');
    } catch (error) {
      next(error);
    }
  }

  async createSubscription(req, res, next) {
    try {
      const { planId, totalCount, quantity } = req.body;
      const { email, name } = req.user;

      let customer = await paymentService.createCustomer(email, name, {
        userId: req.user.id
      });

      const subscription = await paymentService.createSubscription(customer.customerId, planId, {
        totalCount,
        quantity,
        notifyEmail: email
      });

      return ApiResponse.success(res, subscription, 'Subscription created');
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req, res, next) {
    try {
      const { subscriptionId } = req.params;

      const result = await paymentService.cancelSubscription(subscriptionId);

      return ApiResponse.success(res, result, 'Subscription cancelled');
    } catch (error) {
      next(error);
    }
  }

  async walletRecharge(req, res, next) {
    try {
      const { amount, paymentId } = req.body;
      const userId = req.user.id;

      if (!amount || amount <= 0) {
        throw new BadRequestException('Invalid amount');
      }

      const result = await paymentService.createWalletTransaction(userId, amount, 'CREDIT', {
        paymentId,
        description: 'Wallet Recharge'
      });

      return ApiResponse.success(res, result, 'Wallet recharged successfully');
    } catch (error) {
      next(error);
    }
  }

  async walletDebit(req, res, next) {
    try {
      const { amount, reference, description } = req.body;
      const userId = req.user.id;

      if (!amount || amount <= 0) {
        throw new BadRequestException('Invalid amount');
      }

      const result = await paymentService.createWalletTransaction(userId, amount, 'DEBIT', {
        reference,
        description
      });

      return ApiResponse.success(res, result, 'Wallet debited successfully');
    } catch (error) {
      next(error);
    }
  }

  async getWalletBalance(req, res, next) {
    try {
      const userId = req.user.id;

      const balance = await paymentService.getWalletBalance(userId);

      return ApiResponse.success(res, balance, 'Wallet balance retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getWalletHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;

      const result = await paymentService.getWalletTransactions(
        userId,
        parseInt(page),
        parseInt(limit)
      );

      return PaginatedResponse.success(
        res,
        result.transactions,
        result.pagination,
        'Wallet transactions retrieved'
      );
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];

      const isValid = await paymentService.verifyWebhookSignature(req.body, signature);

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const event = req.body.event;
      const payload = req.body.payload;

      console.log(`Processing webhook: ${event}`);

      switch (event) {
        case 'payment.captured':
          await handlePaymentCaptured(payload);
          break;
        case 'payment.failed':
          await handlePaymentFailed(payload);
          break;
        case 'refund.processed':
          await handleRefundProcessed(payload);
          break;
        case 'subscription.activated':
          await handleSubscriptionActivated(payload);
          break;
        case 'subscription.cancelled':
          await handleSubscriptionCancelled(payload);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      return ApiResponse.success(res, { received: true }, 'Webhook processed');
    } catch (error) {
      next(error);
    }
  }

  async createDriverPayout(req, res, next) {
    try {
      const { driverId, amount, rideId } = req.body;

      const payout = await paymentService.processDriverPayout(driverId, amount, rideId);

      return ApiResponse.success(res, payout, 'Payout initiated');
    } catch (error) {
      next(error);
    }
  }

  async createTransfer(req, res, next) {
    try {
      const { orderId, transfers } = req.body;

      const transfer = await paymentService.createTransfer(orderId, transfers);

      return ApiResponse.success(res, transfer, 'Transfer created');
    } catch (error) {
      next(error);
    }
  }
}

async function handlePaymentCaptured(payload) {
  const paymentEntity = payload.payment.entity;
  console.log(`Payment captured: ${paymentEntity.id}`);
}

async function handlePaymentFailed(payload) {
  const paymentEntity = payload.payment.entity;
  console.log(`Payment failed: ${paymentEntity.id}`);
}

async function handleRefundProcessed(payload) {
  const refundEntity = payload.refund.entity;
  console.log(`Refund processed: ${refundEntity.id}`);
}

async function handleSubscriptionActivated(payload) {
  const subscriptionEntity = payload.subscription.entity;
  console.log(`Subscription activated: ${subscriptionEntity.id}`);
}

async function handleSubscriptionCancelled(payload) {
  const subscriptionEntity = payload.subscription.entity;
  console.log(`Subscription cancelled: ${subscriptionEntity.id}`);
}

module.exports = new PaymentController();
