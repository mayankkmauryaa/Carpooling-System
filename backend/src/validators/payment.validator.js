const Joi = require('joi');

const createOrderSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.base': 'Amount must be a number',
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  currency: Joi.string().uppercase().length(3).default('INR').messages({
    'string.length': 'Currency must be a 3-letter code'
  }),
  receipt: Joi.string().optional(),
  notes: Joi.object().optional()
});

const verifyPaymentSchema = Joi.object({
  razorpayOrderId: Joi.string().required().messages({
    'any.required': 'Razorpay order ID is required'
  }),
  razorpayPaymentId: Joi.string().required().messages({
    'any.required': 'Razorpay payment ID is required'
  }),
  razorpaySignature: Joi.string().required().messages({
    'any.required': 'Razorpay signature is required'
  })
});

const capturePaymentSchema = Joi.object({
  razorpayPaymentId: Joi.string().required().messages({
    'any.required': 'Razorpay payment ID is required'
  }),
  amount: Joi.number().positive().optional()
});

const refundSchema = Joi.object({
  paymentId: Joi.number().positive().required().messages({
    'any.required': 'Payment ID is required'
  }),
  amount: Joi.number().positive().optional().messages({
    'number.positive': 'Refund amount must be positive'
  }),
  speed: Joi.string().valid('optimum', 'instant').default('optimum').messages({
    'any.only': 'Speed must be optimum or instant'
  }),
  reason: Joi.string().optional()
});

const createCustomerSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Customer name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Valid email is required',
    'any.required': 'Email is required'
  }),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
    'string.pattern.base': 'Phone must be 10-15 digits',
    'any.required': 'Phone is required'
  })
});

const walletRechargeSchema = Joi.object({
  amount: Joi.number().positive().min(1).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Minimum recharge amount is 1',
    'any.required': 'Amount is required'
  }),
  paymentMethod: Joi.string().valid('card', 'netbanking', 'upi', 'wallet').required().messages({
    'any.only': 'Payment method must be card, netbanking, upi, or wallet',
    'any.required': 'Payment method is required'
  })
});

const walletDebitSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  description: Joi.string().optional()
});

const payoutSchema = Joi.object({
  tripId: Joi.number().positive().required().messages({
    'any.required': 'Trip ID is required'
  })
});

const transferSchema = Joi.object({
  accountId: Joi.string().required().messages({
    'any.required': 'Account ID is required'
  }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Amount must be positive',
    'any.required': 'Amount is required'
  }),
  currency: Joi.string().uppercase().length(3).default('INR'),
  mode: Joi.string().valid('IMPS', 'NEFT', 'RTGS', 'UPI').default('IMPS')
});

const subscriptionSchema = Joi.object({
  planId: Joi.string().required().messages({
    'any.required': 'Plan ID is required'
  }),
  customerId: Joi.string().required().messages({
    'any.required': 'Customer ID is required'
  }),
  totalCount: Joi.number().positive().optional(),
  quantity: Joi.number().positive().default(1),
  expireBy: Joi.number().positive().optional(),
  startAt: Joi.number().positive().optional(),
  notes: Joi.object().optional()
});

module.exports = {
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
};
