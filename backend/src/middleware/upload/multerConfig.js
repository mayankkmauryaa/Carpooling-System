const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const logger = require('../middleware/logger');

const UPLOAD_TEMP_DIR = path.join(process.cwd(), 'uploads', 'temp');
const TEMP_FILE_MAX_AGE = 24 * 60 * 60 * 1000;

const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const ALLOWED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

const ALL_ALLOWED_FORMATS = [
  ...ALLOWED_IMAGE_FORMATS,
  ...ALLOWED_DOCUMENT_FORMATS,
  ...ALLOWED_VIDEO_FORMATS,
  ...ALLOWED_AUDIO_FORMATS
];

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1);
}

function isAllowedFormat(filename) {
  const ext = getFileExtension(filename);
  return ALL_ALLOWED_FORMATS.includes(ext);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!isAllowedFormat(file.originalname)) {
    const error = new Error(`File type not allowed. Allowed: ${ALL_ALLOWED_FORMATS.join(', ')}`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 10
  }
});

const uploadSingle = uploadMiddleware.single('file');
const uploadImages = uploadMiddleware.array('images', 10);
const uploadDocuments = uploadMiddleware.array('documents', 5);
const uploadProfile = uploadMiddleware.single('profile');
const uploadVehiclePhoto = uploadMiddleware.single('image');
const uploadVehiclePhotos = uploadMiddleware.array('vehiclePhotos', 10);
const uploadDriverDocument = uploadMiddleware.single('document');
const uploadVehicleDocuments = uploadMiddleware.array('vehicleDocs', 5);
const uploadReceipt = uploadMiddleware.single('receipt');

const cleanupTempFiles = async () => {
  try {
    const dirExists = await fs.access(UPLOAD_TEMP_DIR).then(() => true).catch(() => false);
    if (!dirExists) return;

    const files = await fs.readdir(UPLOAD_TEMP_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_TEMP_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (now - stats.mtimeMs > TEMP_FILE_MAX_AGE) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      } catch (err) {
        logger.warn(`Failed to process temp file: ${file}`, { error: err.message });
      }
    }

    if (deletedCount > 0) {
      logger.info('Cleaned up temp files', { deletedCount });
    }
  } catch (error) {
    logger.error('Failed to cleanup temp files', { error: error.message });
  }
};

let cleanupIntervalId = null;

const startTempFileCleanup = () => {
  if (cleanupIntervalId === null) {
    cleanupIntervalId = setInterval(cleanupTempFiles, 60 * 60 * 1000);
    cleanupIntervalId.unref();
    cleanupTempFiles();
  }
};

const stopTempFileCleanup = () => {
  if (cleanupIntervalId !== null) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
};

startTempFileCleanup();

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
  UPLOAD_TEMP_DIR,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_DOCUMENT_FORMATS,
  ALLOWED_VIDEO_FORMATS,
  ALLOWED_AUDIO_FORMATS,
  ALL_ALLOWED_FORMATS,
  isAllowedFormat,
  getFileExtension,
  cleanupTempFiles,
  startTempFileCleanup,
  stopTempFileCleanup
};
