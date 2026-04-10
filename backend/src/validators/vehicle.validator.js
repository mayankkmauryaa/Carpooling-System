const Joi = require('joi');
const { paramIdSchema, paginationSchema, preferencesSchema } = require('./common.schemas');

const createVehicleSchema = Joi.object({
  brand: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.max': 'Brand name too long',
      'any.required': 'Car brand is required'
    }),
  model: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.max': 'Model name too long',
      'any.required': 'Car model is required'
    }),
  licensePlate: Joi.string()
    .trim()
    .uppercase()
    .required()
    .messages({
      'any.required': 'License plate is required'
    }),
  color: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': 'Car color is required'
    }),
  capacity: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .required()
    .messages({
      'number.min': 'Capacity must be at least 1',
      'number.max': 'Capacity cannot exceed 8',
      'any.required': 'Capacity is required'
    }),
  preferences: preferencesSchema,
  registrationExpiry: Joi.date()
    .iso()
    .required()
    .messages({
      'date.format': 'Invalid date format',
      'any.required': 'Registration expiry is required'
    })
});

const updateVehicleSchema = Joi.object({
  brand: Joi.string().trim().max(50),
  model: Joi.string().trim().max(100),
  color: Joi.string().trim(),
  preferences: Joi.object({
    smoking: Joi.boolean(),
    pets: Joi.boolean(),
    music: Joi.boolean()
  }),
  isActive: Joi.boolean(),
  registrationExpiry: Joi.date().iso()
});

const vehicleIdParamSchema = paramIdSchema;

const getVehiclesQuerySchema = paginationSchema.append({
  isActive: Joi.boolean(),
  search: Joi.string().trim(),
  brand: Joi.string().trim(),
  model: Joi.string().trim(),
  color: Joi.string().trim()
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  getVehiclesQuerySchema
};
