const express = require('express');
const router = express.Router();
const paymentMethodController = require('../../controllers/paymentMethodController');
const { auth } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const {
  addPaymentMethodSchema,
  updatePaymentMethodSchema,
  methodIdSchema
} = require('../../validators/paymentMethod.validator');

router.post(
  '/',
  auth,
  validate(addPaymentMethodSchema),
  paymentMethodController.addPaymentMethod
);

router.get(
  '/',
  auth,
  paymentMethodController.getMyPaymentMethods
);

router.get(
  '/:methodId',
  auth,
  validate(methodIdSchema, 'params'),
  paymentMethodController.getPaymentMethod
);

router.put(
  '/:methodId',
  auth,
  validate(methodIdSchema, 'params'),
  validate(updatePaymentMethodSchema),
  paymentMethodController.updatePaymentMethod
);

router.delete(
  '/:methodId',
  auth,
  validate(methodIdSchema, 'params'),
  paymentMethodController.deletePaymentMethod
);

router.put(
  '/:methodId/default',
  auth,
  validate(methodIdSchema, 'params'),
  paymentMethodController.setDefault
);

router.put(
  '/:methodId/deactivate',
  auth,
  validate(methodIdSchema, 'params'),
  paymentMethodController.deactivate
);

router.put(
  '/:methodId/reactivate',
  auth,
  validate(methodIdSchema, 'params'),
  paymentMethodController.reactivate
);

module.exports = router;
