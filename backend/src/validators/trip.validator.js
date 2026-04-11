const Joi = require('joi');
const { paramIdSchema, paginationSchema, dateRangeSchema } = require('./common.schemas');

const startTripSchema = Joi.object({
  rideId: Joi.number().positive().required().messages({
    'any.required': 'Ride ID is required'
  })
});

const completeTripSchema = Joi.object({
  actualDistance: Joi.number().min(0).required().messages({
    'number.min': 'Actual distance cannot be negative',
    'any.required': 'Actual distance is required'
  }),
  actualDuration: Joi.number().min(0).required().messages({
    'number.min': 'Actual duration cannot be negative',
    'any.required': 'Actual duration is required'
  }),
  endLocation: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2).required(),
    address: Joi.string()
  })
});

const cancelTripSchema = Joi.object({
  reason: Joi.string().max(500)
});

const tripIdParamSchema = paramIdSchema;

const getTripsQuerySchema = paginationSchema.append({
  status: Joi.string().valid('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
}).concat(dateRangeSchema);

module.exports = {
  startTripSchema,
  completeTripSchema,
  cancelTripSchema,
  tripIdParamSchema,
  getTripsQuerySchema
};
