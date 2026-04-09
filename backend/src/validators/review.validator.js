const Joi = require('joi');
const { objectIdSchema, paginationSchema } = require('./common.schemas');

const createReviewSchema = Joi.object({
  tripId: Joi.string()
    .length(24)
    .required()
    .messages({
      'string.length': 'Invalid trip ID format',
      'any.required': 'Trip ID is required'
    }),
  revieweeId: Joi.string()
    .length(24)
    .required()
    .messages({
      'string.length': 'Invalid user ID format',
      'any.required': 'Reviewee ID is required'
    }),
  type: Joi.string()
    .valid('driver-to-rider', 'rider-to-driver')
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

const reviewIdParamSchema = objectIdSchema;

const userIdParamSchema = Joi.object({
  userId: Joi.string()
    .length(24)
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
});

const tripIdParamSchema = Joi.object({
  tripId: Joi.string()
    .length(24)
    .required()
    .messages({
      'any.required': 'Trip ID is required'
    })
});

const getReviewsQuerySchema = paginationSchema.append({
  type: Joi.string().valid('driver-to-rider', 'rider-to-driver'),
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
