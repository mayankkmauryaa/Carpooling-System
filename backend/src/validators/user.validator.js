const Joi = require('joi');
const { paramIdSchema, paginationSchema, passwordSchema } = require('./common.schemas');

const updateProfileSchema = Joi.object({
  firstName: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'First name too long'
    }),
  lastName: Joi.string()
    .trim()
    .max(50)
    .messages({
      'string.max': 'Last name too long'
    }),
  phone: Joi.string()
    .trim()
    .messages({}),
  profilePicture: Joi.string()
    .uri()
    .allow(null, '')
    .messages({
      'string.uri': 'Invalid profile picture URL'
    }),
  isProfileBlurred: Joi.boolean()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: passwordSchema
});

const userIdParamSchema = paramIdSchema;

const userReviewsQuerySchema = paginationSchema;

const getAllUsersQuerySchema = paginationSchema.append({
  role: Joi.string().valid('DRIVER', 'RIDER', 'ADMIN'),
  search: Joi.string().trim()
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  userIdParamSchema,
  userReviewsQuerySchema,
  getAllUsersQuerySchema
};
