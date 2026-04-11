const express = require('express');
const router = express.Router();
const ownerDocumentController = require('../../controllers/ownerDocumentController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const { uploadDriverDocument } = require('../../middleware/upload');
const {
  uploadOwnerDocumentSchema,
  documentIdSchema
} = require('../../validators/owner.validator');

router.post(
  '/',
  auth,
  requireRole('OWNER'),
  uploadDriverDocument,
  validate(uploadOwnerDocumentSchema),
  ownerDocumentController.uploadDocument
);

router.get(
  '/',
  auth,
  requireRole('OWNER'),
  ownerDocumentController.getMyDocuments
);

router.get(
  '/status',
  auth,
  requireRole('OWNER'),
  ownerDocumentController.getDocumentStatus
);

router.post(
  '/submit-review',
  auth,
  requireRole('OWNER'),
  ownerDocumentController.submitForReview
);

router.get(
  '/:documentId',
  auth,
  requireRole('OWNER'),
  validate(documentIdSchema, 'params'),
  ownerDocumentController.getDocument
);

router.delete(
  '/:documentId',
  auth,
  requireRole('OWNER'),
  validate(documentIdSchema, 'params'),
  ownerDocumentController.deleteDocument
);

module.exports = router;
