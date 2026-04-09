const Joi = require('joi');

const objectIdSchema = Joi.object({
  id: Joi.string()
    .length(24)
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.length': 'Invalid ID format',
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});

const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  });

const passwordSchema = Joi.string()
  .min(6)
  .required()
  .messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  });

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const coordinatesSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array()
    .items(Joi.number())
    .length(2)
    .required()
    .messages({
      'array.length': 'Coordinates must be [longitude, latitude]'
    }),
  address: Joi.string().required()
});

const preferencesSchema = Joi.object({
  smoking: Joi.boolean().default(false),
  pets: Joi.boolean().default(false),
  femaleOnly: Joi.boolean().default(false),
  music: Joi.boolean().default(true)
}).default();

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate'))
});

module.exports = {
  objectIdSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,
  coordinatesSchema,
  preferencesSchema,
  dateRangeSchema
};
