const Joi = require('joi');
const { paramIdSchema, paginationSchema, dateRangeSchema } = require('./common.schemas');

const startTripSchema = Joi.object({});

const completeTripSchema = Joi.object({
  actualDistance: Joi.number().min(0),
  actualDuration: Joi.number().min(0),
  endLocation: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2),
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
