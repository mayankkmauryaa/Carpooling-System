const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  createOrderSchema,
  verifyPaymentSchema,
  capturePaymentSchema,
  refundSchema,
  createCustomerSchema,
  walletRechargeSchema,
  walletDebitSchema,
  payoutSchema,
  transferSchema,
  subscriptionSchema
} = require('../../validators');

router.post('/order', auth, validate(createOrderSchema), paymentController.createOrder);
router.post('/verify', validate(verifyPaymentSchema), paymentController.verifyPayment);
router.post('/capture', auth, validate(capturePaymentSchema), paymentController.capturePayment);
router.post('/refund', auth, validate(refundSchema), paymentController.refundPayment);
router.get('/payment/:paymentId', auth, paymentController.getPaymentDetails);

router.post('/customer', auth, validate(createCustomerSchema), paymentController.createCustomer);
router.get('/customer/:customerId', auth, paymentController.getCustomer);

router.post('/subscription', auth, validate(subscriptionSchema), paymentController.createSubscription);
router.delete('/subscription/:subscriptionId', auth, paymentController.cancelSubscription);

router.post('/wallet/recharge', auth, validate(walletRechargeSchema), paymentController.walletRecharge);
router.post('/wallet/debit', auth, validate(walletDebitSchema), paymentController.walletDebit);
router.get('/wallet/balance', auth, paymentController.getWalletBalance);
router.get('/wallet/transactions', auth, paymentController.getWalletHistory);

router.post('/payout', auth, requireRole('ADMIN'), validate(payoutSchema), paymentController.createDriverPayout);
router.post('/transfer', auth, requireRole('ADMIN'), validate(transferSchema), paymentController.createTransfer);

router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
