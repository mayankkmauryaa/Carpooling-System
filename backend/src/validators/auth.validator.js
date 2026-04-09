const Joi = require('joi');
const { ROLES } = require('../constants/roles');
const { emailSchema, passwordSchema } = require('./common.schemas');

const registerSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.max': 'First name too long',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.max': 'Last name too long',
      'any.required': 'Last name is required'
    }),
  phone: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': 'Phone number is required'
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .default('rider')
    .messages({
      'any.only': 'Invalid role'
    })
});

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const googleTokenSchema = Joi.object({
  idToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Google ID token is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  googleTokenSchema
};
