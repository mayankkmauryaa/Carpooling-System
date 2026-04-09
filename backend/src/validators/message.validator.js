const Joi = require('joi');
const { paramIdSchema } = require('./common.schemas');

const sendMessageSchema = Joi.object({
  receiverId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid receiver ID format',
      'any.required': 'Receiver ID is required'
    }),
  ridePoolId: Joi.string()
    .pattern(/^\d+$/)
    .allow(null),
  content: Joi.string()
    .max(2000)
    .required()
    .messages({
      'string.max': 'Message too long (max 2000 characters)',
      'any.required': 'Message content is required'
    })
});

const getMessagesQuerySchema = Joi.object({
  userId: Joi.string().pattern(/^\d+$/),
  ridePoolId: Joi.string().pattern(/^\d+$/),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50)
});

const markAsReadSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
});

const conversationUserIdParamSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'any.required': 'User ID is required'
    })
});

const messageIdParamSchema = Joi.object({
  messageId: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'any.required': 'Message ID is required'
    })
});

module.exports = {
  sendMessageSchema,
  getMessagesQuerySchema,
  markAsReadSchema,
  conversationUserIdParamSchema,
  messageIdParamSchema
};
