const Joi = require('joi');

const PAYMENT_METHOD_TYPES = ['CARD', 'UPI', 'BANK_ACCOUNT', 'WALLET', 'CASH'];

const addPaymentMethodSchema = Joi.object({
  type: Joi.string()
    .valid(...PAYMENT_METHOD_TYPES)
    .required()
    .messages({
      'any.required': 'Payment method type is required',
      'any.only': `Type must be one of: ${PAYMENT_METHOD_TYPES.join(', ')}`
    }),
  details: Joi.when('type', {
    is: 'CASH',
    then: Joi.object().optional(),
    otherwise: Joi.object().required().messages({
      'any.required': 'Payment method details are required'
    })
  }),
  isDefault: Joi.boolean().optional()
});

const updatePaymentMethodSchema = Joi.object({
  details: Joi.object().optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
  isDefault: Joi.boolean().optional()
});

const cardDetailsSchema = Joi.object({
  cardNumber: Joi.string().creditCard().required(),
  cardHolderName: Joi.string().required(),
  expiryMonth: Joi.string().pattern(/^(0[1-9]|1[0-2])$/).required(),
  expiryYear: Joi.string().pattern(/^\d{2}$/).required(),
  cvv: Joi.string().pattern(/^\d{3,4}$/).required()
});

const upiDetailsSchema = Joi.object({
  upiId: Joi.string().pattern(/^[\w.-]+@[\w.-]+$/).required()
});

const bankAccountDetailsSchema = Joi.object({
  accountNumber: Joi.string().pattern(/^\d{9,18}$/).required(),
  ifsc: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
  accountHolderName: Joi.string().required(),
  bankName: Joi.string().optional()
});

const walletDetailsSchema = Joi.object({
  walletProvider: Joi.string().required(),
  walletId: Joi.string().optional()
});

const methodIdSchema = Joi.object({
  methodId: Joi.number().integer().positive().required()
});

module.exports = {
  addPaymentMethodSchema,
  updatePaymentMethodSchema,
  cardDetailsSchema,
  upiDetailsSchema,
  bankAccountDetailsSchema,
  walletDetailsSchema,
  methodIdSchema
};
