const express = require('express');
const router = express.Router();
const vehicleDocumentController = require('../../controllers/vehicleDocumentController');
const { auth, requireRole } = require('../../middleware/auth');
const { validate } = require('../../middleware/common');
const { uploadDriverDocument, uploadDocuments } = require('../../middleware/upload');
const {
  uploadVehicleDocumentSchema,
  uploadMultipleVehicleDocumentsSchema,
  vehicleIdSchema,
  vehicleDocumentIdSchema
} = require('../../validators/vehicle.validator');

router.post(
  '/',
  auth,
  requireRole('DRIVER', 'OWNER'),
  uploadDriverDocument,
  validate(uploadVehicleDocumentSchema),
  vehicleDocumentController.uploadDocument
);

router.post(
  '/batch',
  auth,
  requireRole('DRIVER', 'OWNER'),
  uploadDocuments,
  validate(uploadMultipleVehicleDocumentsSchema),
  vehicleDocumentController.uploadMultipleDocuments
);

router.get(
  '/my-vehicles',
  auth,
  requireRole('DRIVER', 'OWNER'),
  vehicleDocumentController.getMyVehicleDocuments
);

router.get(
  '/vehicle/:vehicleId',
  auth,
  requireRole('DRIVER', 'OWNER'),
  validate(vehicleIdSchema, 'params'),
  vehicleDocumentController.getVehicleDocuments
);

router.get(
  '/vehicle/:vehicleId/status',
  auth,
  requireRole('DRIVER', 'OWNER'),
  validate(vehicleIdSchema, 'params'),
  vehicleDocumentController.getDocumentStatus
);

router.post(
  '/vehicle/:vehicleId/submit-review',
  auth,
  requireRole('DRIVER', 'OWNER'),
  validate(vehicleIdSchema, 'params'),
  vehicleDocumentController.submitForReview
);

router.get(
  '/:documentId',
  auth,
  requireRole('DRIVER', 'OWNER'),
  validate(vehicleDocumentIdSchema, 'params'),
  vehicleDocumentController.getDocument
);

router.delete(
  '/:documentId',
  auth,
  requireRole('DRIVER', 'OWNER'),
  validate(vehicleDocumentIdSchema, 'params'),
  vehicleDocumentController.deleteDocument
);

module.exports = router;
