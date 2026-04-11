const Joi = require('joi');
const { paramIdSchema, paginationSchema } = require('./common.schemas');

const locationSchema = Joi.object({
  type: Joi.string().valid('Point').default('Point'),
  coordinates: Joi.array().items(Joi.number()).length(2),
  address: Joi.string()
});

const createBooking = Joi.object({
  ridePoolId: Joi.number().integer().required(),
  seatsBooked: Joi.number().integer().min(1).default(1),
  pickupLocation: locationSchema,
  dropLocation: locationSchema,
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional().greater(Joi.ref('startDate'))
});

const updateStatus = Joi.object({
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
    .required()
});

const bookingIdParam = paramIdSchema;

const getBookingsQuery = paginationSchema.append({
  status: Joi.string().valid('PENDING', 'APPROVED', 'PAID', 'ACTIVE', 'CONFIRMED', 'CANCELLED', 'COMPLETED'),
  userId: Joi.number().integer(),
  ridePoolId: Joi.number().integer()
});

const bookingValidator = {
  createBooking,
  updateStatus,
  bookingIdParam,
  getBookingsQuery
};

module.exports = {
  bookingValidator,
  createBooking,
  updateStatus,
  bookingIdParam,
  getBookingsQuery
};
