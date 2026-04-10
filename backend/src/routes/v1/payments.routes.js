const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/paymentController');
const { auth, requireRole } = require('../../middleware/auth');

router.post('/order', auth, paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.post('/capture', auth, paymentController.capturePayment);
router.post('/refund', auth, paymentController.refundPayment);
router.get('/payment/:paymentId', auth, paymentController.getPaymentDetails);

router.post('/customer', auth, paymentController.createCustomer);
router.get('/customer/:customerId', auth, paymentController.getCustomer);

router.post('/subscription', auth, paymentController.createSubscription);
router.delete('/subscription/:subscriptionId', auth, paymentController.cancelSubscription);

router.post('/wallet/recharge', auth, paymentController.walletRecharge);
router.post('/wallet/debit', auth, paymentController.walletDebit);
router.get('/wallet/balance', auth, paymentController.getWalletBalance);
router.get('/wallet/transactions', auth, paymentController.getWalletHistory);

router.post('/payout', auth, requireRole('ADMIN'), paymentController.createDriverPayout);
router.post('/transfer', auth, requireRole('ADMIN'), paymentController.createTransfer);

router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
