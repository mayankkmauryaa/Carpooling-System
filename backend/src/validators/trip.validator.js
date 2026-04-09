const Joi = require('joi');
const { objectIdSchema, paginationSchema, dateRangeSchema } = require('./common.schemas');

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

const tripIdParamSchema = objectIdSchema;

const getTripsQuerySchema = paginationSchema.append({
  status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled')
}).concat(dateRangeSchema);

module.exports = {
  startTripSchema,
  completeTripSchema,
  cancelTripSchema,
  tripIdParamSchema,
  getTripsQuerySchema
};
