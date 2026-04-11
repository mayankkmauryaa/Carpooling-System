const Joi = require('joi');
const { OWNER_DOCUMENT_TYPES } = require('../constants/documentTypes');

const registerOwnerSchema = Joi.object({
  businessName: Joi.string().min(2).max(200).optional(),
  gstNumber: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().messages({
    'string.pattern.base': 'Invalid GST number format'
  }),
  panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().messages({
    'string.pattern.base': 'Invalid PAN number format'
  })
});

const updateOwnerProfileSchema = Joi.object({
  businessName: Joi.string().min(2).max(200).optional(),
  gstNumber: Joi.string().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).optional().messages({
    'string.pattern.base': 'Invalid GST number format'
  }),
  panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().messages({
    'string.pattern.base': 'Invalid PAN number format'
  })
});

const uploadOwnerDocumentSchema = Joi.object({
  documentType: Joi.string()
    .valid(...Object.values(OWNER_DOCUMENT_TYPES))
    .required()
    .messages({
      'any.required': 'Document type is required',
      'any.only': `Document type must be one of: ${Object.values(OWNER_DOCUMENT_TYPES).join(', ')}`
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
  registerOwnerSchema,
  updateOwnerProfileSchema,
  uploadOwnerDocumentSchema,
  documentIdSchema
};
