const {
  uploadMiddleware,
  uploadSingle,
  uploadImages,
  uploadDocuments,
  uploadProfile,
  uploadVehiclePhoto,
  uploadVehiclePhotos,
  uploadDriverDocument,
  uploadVehicleDocuments,
  uploadReceipt,
  UPLOAD_TEMP_DIR,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_DOCUMENT_FORMATS,
  ALLOWED_VIDEO_FORMATS,
  ALLOWED_AUDIO_FORMATS,
  isAllowedFormat,
  getFileExtension
} = require('./multerConfig');

const uploadService = require('../../services/uploadService');

module.exports = {
  uploadMiddleware,
  uploadSingle,
  uploadImages,
  uploadDocuments,
  uploadProfile,
  uploadVehiclePhoto,
  uploadVehiclePhotos,
  uploadDriverDocument,
  uploadVehicleDocuments,
  uploadReceipt,
  uploadService,
  UPLOAD_TEMP_DIR,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_DOCUMENT_FORMATS,
  ALLOWED_VIDEO_FORMATS,
  ALLOWED_AUDIO_FORMATS,
  isAllowedFormat,
  getFileExtension
};
