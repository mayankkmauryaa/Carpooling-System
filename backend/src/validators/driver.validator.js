const Joi = require('joi');
const { DRIVER_DOCUMENT_TYPES } = require('../constants/documentTypes');

const uploadDriverDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(...Object.values(DRIVER_DOCUMENT_TYPES))
    .required()
    .messages({
      'any.required': 'Document type is required',
      'any.only': `Document type must be one of: ${Object.values(DRIVER_DOCUMENT_TYPES).join(', ')}`
    }),
  expiresAt: Joi.date()
    .iso()
    .greater('now')
    .optional()
    .messages({
      'date.greater': 'Expiry date must be in the future'
    })
});

const documentIdSchema = Joi.object({
  documentId: Joi.number()
    .integer()
    .positive()
    .required()
});

module.exports = {
  uploadDriverDocumentSchema,
  documentIdSchema
};
