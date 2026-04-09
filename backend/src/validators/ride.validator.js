const Joi = require('joi');
const { coordinatesSchema, preferencesSchema, objectIdSchema, paginationSchema } = require('./common.schemas');

const createRideSchema = Joi.object({
  vehicleId: Joi.string()
    .length(24)
    .required()
    .messages({
      'string.length': 'Invalid vehicle ID format',
      'any.required': 'Vehicle is required'
    }),
  pickupLocation: coordinatesSchema.required(),
  dropLocation: coordinatesSchema.required(),
  departureTime: Joi.date()
    .iso()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Departure time must be in the future',
      'any.required': 'Departure time is required'
    }),
  availableSeats: Joi.number()
    .integer()
    .min(1)
    .max(8)
    .required()
    .messages({
      'number.min': 'At least 1 seat required',
      'number.max': 'Maximum 8 seats'
    }),
  pricePerSeat: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min': 'Price cannot be negative'
    }),
  preferences: preferencesSchema,
  routeData: Joi.object({
    waypoints: Joi.array().items(Joi.array().items(Joi.number())),
    distance: Joi.number(),
    duration: Joi.number()
  })
});

const searchRideSchema = paginationSchema.append({
  pickupLat: Joi.number().min(-90).max(90),
  pickupLng: Joi.number().min(-180).max(180),
  dropLat: Joi.number().min(-90).max(90),
  dropLng: Joi.number().min(-180).max(180),
  radius: Joi.number().min(1).max(100).default(10),
  departureDate: Joi.date().iso(),
  availableSeats: Joi.number().integer().min(1).default(1),
  preferences: Joi.object({
    smoking: Joi.boolean(),
    pets: Joi.boolean(),
    femaleOnly: Joi.boolean()
  })
});

const joinRideSchema = Joi.object({
  pickupLocation: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2),
    address: Joi.string()
  }).required(),
  dropLocation: Joi.object({
    coordinates: Joi.array().items(Joi.number()).length(2),
    address: Joi.string()
  }).required()
});

const rideIdParamSchema = objectIdSchema;

const respondToRequestSchema = Joi.object({
  action: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': 'Action must be approve or reject',
      'any.required': 'Action is required'
    }),
  reason: Joi.string().max(500)
});

const updateRideStatusSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'completed', 'cancelled')
    .required()
    .messages({
      'any.only': 'Invalid status',
      'any.required': 'Status is required'
    })
});

module.exports = {
  createRideSchema,
  searchRideSchema,
  joinRideSchema,
  rideIdParamSchema,
  respondToRequestSchema,
  updateRideStatusSchema
};
