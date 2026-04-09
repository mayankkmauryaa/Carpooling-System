const Joi = require('joi');

const idSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
});

const paramIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'ID must be a valid number',
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
  idSchema,
  paramIdSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,
  coordinatesSchema,
  preferencesSchema,
  dateRangeSchema
};
