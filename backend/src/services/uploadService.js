const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
const ALLOWED_DOCUMENT_FORMATS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
const ALLOWED_AUDIO_FORMATS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];

const FILE_CATEGORIES = {
  user: ['profile', 'license', 'id_proof', 'background_check'],
  vehicle: ['registration', 'insurance', 'inspection', 'photo', 'thumbnail'],
  ride: ['receipt', 'proof', 'evidence'],
  trip: ['receipt', 'invoice', 'document'],
  misc: ['document', 'attachment']
};

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 20 * 1024 * 1024
};

function getFileExtension(filename) {
  return path.extname(filename).toLowerCase().slice(1);
}

function getFileCategory(filename) {
  const ext = getFileExtension(filename);
  if (ALLOWED_IMAGE_FORMATS.includes(ext)) return 'image';
  if (ALLOWED_DOCUMENT_FORMATS.includes(ext)) return 'document';
  if (ALLOWED_VIDEO_FORMATS.includes(ext)) return 'video';
  if (ALLOWED_AUDIO_FORMATS.includes(ext)) return 'audio';
  return null;
}

function isAllowedFormat(filename) {
  const ext = getFileExtension(filename);
  return [
    ...ALLOWED_IMAGE_FORMATS,
    ...ALLOWED_DOCUMENT_FORMATS,
    ...ALLOWED_VIDEO_FORMATS,
    ...ALLOWED_AUDIO_FORMATS
  ].includes(ext);
}

function getMaxFileSize(category) {
  return MAX_FILE_SIZES[category] || MAX_FILE_SIZES.document;
}

async function uploadFromBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'carpooling',
        public_id: options.publicId,
        resource_type: options.resourceType || 'auto',
        transformation: options.transformation,
        eager: options.eager,
        eager_async: options.eagerAsync || false,
        format: options.format,
        quality: options.quality || 'auto',
        fetch_format: options.fetchFormat || 'auto',
        flags: options.flags,
        metadata: options.metadata
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function uploadFromURL(url, options = {}) {
  return await cloudinary.uploader.upload(url, {
    folder: options.folder || 'carpooling',
    public_id: options.publicId,
    resource_type: options.resourceType || 'auto',
    quality: options.quality || 'auto',
    fetch_format: options.fetchFormat || 'auto',
    ...options
  });
}

async function uploadLocalFile(filePath, options = {}) {
  return await cloudinary.uploader.upload(filePath, {
    folder: options.folder || 'carpooling',
    public_id: options.publicId,
    resource_type: options.resourceType || 'auto',
    quality: options.quality || 'auto',
    fetch_format: options.fetchFormat || 'auto',
    ...options
  });
}

async function uploadUserProfile(fileBuffer, userId, options = {}) {
  const transformation = options.transformation || [
    { width: 500, height: 500, crop: 'fill', gravity: 'face' },
    { quality: 'auto', fetch_format: 'auto' }
  ];

  return await uploadFromBuffer(fileBuffer, {
    folder: `carpooling/users/${userId}/profile`,
    public_id: `profile_${Date.now()}`,
    transformation,
    resourceType: 'image'
  });
}

async function uploadVehicleImage(fileBuffer, vehicleId, type = 'photo', options = {}) {
  const transformation = type === 'thumbnail' 
    ? [{ width: 300, height: 200, crop: 'fill' }, { quality: 'auto' }]
    : [{ quality: 'auto', fetch_format: 'auto' }];

  return await uploadFromBuffer(fileBuffer, {
    folder: `carpooling/vehicles/${vehicleId}`,
    public_id: `${type}_${Date.now()}`,
    transformation,
    resourceType: 'image'
  });
}

async function uploadDriverDocument(fileBuffer, driverId, documentType, options = {}) {
  return await uploadFromBuffer(fileBuffer, {
    folder: `carpooling/drivers/${driverId}/documents`,
    public_id: `${documentType}_${Date.now()}`,
    resourceType: 'auto'
  });
}

async function uploadVehicleDocuments(files, vehicleId, documentTypes = []) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docType = documentTypes[i] || 'document';
    
    const result = await uploadFromBuffer(file.buffer, {
      folder: `carpooling/vehicles/${vehicleId}/documents`,
      public_id: `${docType}_${Date.now()}_${i}`,
      resourceType: 'auto'
    });
    
    results.push({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      documentType: docType
    });
  }
  
  return results;
}

async function uploadRideReceipt(fileBuffer, rideId, options = {}) {
  return await uploadFromBuffer(fileBuffer, {
    folder: `carpooling/rides/${rideId}/receipts`,
    public_id: `receipt_${Date.now()}`,
    resourceType: 'auto'
  });
}

async function uploadTripDocument(fileBuffer, tripId, documentType, options = {}) {
  return await uploadFromBuffer(fileBuffer, {
    folder: `carpooling/trips/${tripId}/documents`,
    public_id: `${documentType}_${Date.now()}`,
    resourceType: 'auto'
  });
}

async function deleteFile(publicId, resourceType = 'image') {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType
  });
}

async function deleteMultipleFiles(publicIds, resourceType = 'image') {
  return await cloudinary.api.delete_resources(publicIds, {
    resource_type: resourceType
  });
}

async function deleteFolder(folderPath) {
  return await cloudinary.api.delete_folder(folderPath);
}

async function getResourceMetadata(publicId, resourceType = 'image') {
  return await cloudinary.api.resource(publicId, {
    resource_type: resourceType
  });
}

async function createZipDownload(publicIds, folderName = 'download') {
  return await cloudinary.utils.zip_download_url(publicIds);
}

function generateSignedUpload(publicId, options = {}) {
  const timestamp = Math.round(Date.now() / 1000);
  return cloudinary.utils.api_sign_request(
    {
      public_id: publicId,
      timestamp,
      ...options
    },
    cloudinary.config().api_secret
  );
}

function generateSignedUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    ...options
  });
}

function getOptimizedImageUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    quality: 'auto',
    fetch_format: 'auto',
    width: options.width,
    height: options.height,
    crop: options.crop || 'fill',
    gravity: options.gravity || 'auto',
    ...options
  });
}

function getThumbnailUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    width: options.width || 150,
    height: options.height || 150,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto'
  });
}

module.exports = {
  cloudinary,
  uploadFromBuffer,
  uploadFromURL,
  uploadLocalFile,
  uploadUserProfile,
  uploadVehicleImage,
  uploadDriverDocument,
  uploadVehicleDocuments,
  uploadRideReceipt,
  uploadTripDocument,
  deleteFile,
  deleteMultipleFiles,
  deleteFolder,
  getResourceMetadata,
  createZipDownload,
  generateSignedUpload,
  generateSignedUrl,
  getOptimizedImageUrl,
  getThumbnailUrl,
  getFileExtension,
  getFileCategory,
  isAllowedFormat,
  getMaxFileSize,
  FILE_CATEGORIES,
  ALLOWED_IMAGE_FORMATS,
  ALLOWED_DOCUMENT_FORMATS,
  ALLOWED_VIDEO_FORMATS,
  ALLOWED_AUDIO_FORMATS,
  MAX_FILE_SIZES
};
