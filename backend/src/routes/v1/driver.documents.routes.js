const express = require('express');
const router = express.Router();
const driverDocumentController = require('../../controllers/driverDocumentController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const { uploadDriverDocument } = require('../../middleware/upload');
const {
  uploadDriverDocumentSchema,
  documentIdSchema
} = require('../../validators/driver.validator');

router.post(
  '/',
  auth,
  requireRole('DRIVER'),
  uploadDriverDocument,
  validate(uploadDriverDocumentSchema),
  driverDocumentController.uploadDocument
);

router.get(
  '/',
  auth,
  requireRole('DRIVER'),
  driverDocumentController.getMyDocuments
);

router.get(
  '/status',
  auth,
  requireRole('DRIVER'),
  driverDocumentController.getDocumentStatus
);

router.post(
  '/submit-review',
  auth,
  requireRole('DRIVER'),
  driverDocumentController.submitForReview
);

router.get(
  '/:documentId',
  auth,
  requireRole('DRIVER'),
  validate(documentIdSchema, 'params'),
  driverDocumentController.getDocument
);

router.delete(
  '/:documentId',
  auth,
  requireRole('DRIVER'),
  validate(documentIdSchema, 'params'),
  driverDocumentController.deleteDocument
);

module.exports = router;
