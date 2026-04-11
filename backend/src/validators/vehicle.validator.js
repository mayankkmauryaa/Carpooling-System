const Joi = require('joi');
const { VEHICLE_DOCUMENT_TYPES } = require('../constants/documentTypes');

const uploadVehicleDocumentSchema = Joi.object({
  vehicleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Vehicle ID is required'
    }),
  documentType: Joi.string()
    .valid(...Object.values(VEHICLE_DOCUMENT_TYPES))
    .required()
    .messages({
      'any.required': 'Document type is required',
      'any.only': `Document type must be one of: ${Object.values(VEHICLE_DOCUMENT_TYPES).join(', ')}`
    }),
  expiresAt: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.base': 'Expiry date must be a valid date',
      'date.greater': 'Expiry date must be in the future'
    })
});

const uploadMultipleVehicleDocumentsSchema = Joi.object({
  vehicleId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'any.required': 'Vehicle ID is required'
    }),
  documentTypes: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string().valid(...Object.values(VEHICLE_DOCUMENT_TYPES))),
      Joi.string()
    )
    .required()
    .messages({
      'any.required': 'Document types are required'
    }),
  expiresAt: Joi.alternatives()
    .try(
      Joi.array().items(Joi.date().iso().greater('now')),
      Joi.date().iso().greater('now')
    )
    .optional()
    .messages({
      'date.greater': 'Expiry date must be in the future'
    })
});

const vehicleIdSchema = Joi.object({
  vehicleId: Joi.number()
    .integer()
    .positive()
    .required()
});

const vehicleDocumentIdSchema = Joi.object({
  documentId: Joi.number()
    .integer()
    .positive()
    .required()
});

module.exports = {
  uploadVehicleDocumentSchema,
  uploadMultipleVehicleDocumentsSchema,
  vehicleIdSchema,
  vehicleDocumentIdSchema
};
