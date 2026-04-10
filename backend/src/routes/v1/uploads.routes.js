const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { UploadController } = require('../../controllers/uploadController');
const { 
  uploadSingle,
  uploadImages,
  uploadDocuments,
  uploadProfile,
  uploadVehiclePhoto,
  uploadVehiclePhotos,
  uploadDriverDocument,
  uploadVehicleDocuments
} = require('../../middleware/upload');

router.post(
  '/file',
  auth,
  uploadSingle,
  UploadController.uploadFile
);

router.post(
  '/files',
  auth,
  uploadImages,
  UploadController.uploadMultipleFiles
);

router.post(
  '/profile',
  auth,
  uploadProfile,
  UploadController.uploadProfileImage
);

router.post(
  '/vehicle/:vehicleId/image',
  auth,
  uploadVehiclePhoto,
  UploadController.uploadVehicleImage
);

router.post(
  '/vehicle/:vehicleId/images',
  auth,
  uploadVehiclePhotos,
  UploadController.uploadVehicleImages
);

router.post(
  '/driver/document',
  auth,
  uploadDriverDocument,
  UploadController.uploadDriverDocument
);

router.post(
  '/vehicle/:vehicleId/documents',
  auth,
  uploadVehicleDocuments,
  UploadController.uploadDriverDocument
);

router.delete(
  '/:publicId',
  auth,
  UploadController.deleteUploadedFile
);

router.delete(
  '/',
  auth,
  UploadController.deleteMultipleFiles
);

router.get(
  '/metadata/:publicId',
  auth,
  UploadController.getFileMetadata
);

router.get(
  '/optimize/:publicId',
  auth,
  UploadController.getOptimizedImage
);

router.get(
  '/thumbnail/:publicId',
  auth,
  UploadController.getThumbnail
);

module.exports = router;
