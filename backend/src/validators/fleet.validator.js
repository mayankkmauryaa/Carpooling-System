const Joi = require('joi');

const assignDriverSchema = Joi.object({
  vehicleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Vehicle ID is required',
      'number.base': 'Vehicle ID must be a number'
    }),
  driverId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Driver ID is required',
      'number.base': 'Driver ID must be a number'
    })
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const utilizationSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30)
});

const performanceSchema = Joi.object({
  period: Joi.string().pattern(/^\d+d$/).default('30d')
});

module.exports = {
  assignDriverSchema,
  paginationSchema,
  utilizationSchema,
  performanceSchema
};
