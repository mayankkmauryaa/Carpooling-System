const Joi = require('joi');
const { paramIdSchema, paginationSchema } = require('./common.schemas');

const createReviewSchema = Joi.object({
  tripId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid trip ID format',
      'any.required': 'Trip ID is required'
    }),
  revieweeId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'Reviewee ID is required'
    }),
  type: Joi.string()
    .valid('DRIVER_TO_RIDER', 'RIDER_TO_DRIVER')
    .required()
    .messages({
      'any.only': 'Invalid review type',
      'any.required': 'Review type is required'
    }),
  rating: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
    .messages({
      'number.min': 'Rating must be at least 1',
      'number.max': 'Rating cannot exceed 5',
      'any.required': 'Rating is required'
    }),
  comment: Joi.string()
    .max(1000)
    .trim()
    .messages({
      'string.max': 'Comment too long (max 1000 characters)'
    })
});

const reviewIdParamSchema = paramIdSchema;

const userIdParamSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
});

const tripIdParamSchema = Joi.object({
  tripId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'any.required': 'Trip ID is required'
    })
});

const getReviewsQuerySchema = paginationSchema.append({
  type: Joi.string().valid('DRIVER_TO_RIDER', 'RIDER_TO_DRIVER'),
  minRating: Joi.number().integer().min(1).max(5),
  maxRating: Joi.number().integer().min(1).max(5)
});

module.exports = {
  createReviewSchema,
  reviewIdParamSchema,
  userIdParamSchema,
  tripIdParamSchema,
  getReviewsQuerySchema
};
