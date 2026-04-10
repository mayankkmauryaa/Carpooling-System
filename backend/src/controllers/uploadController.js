const fs = require('fs');
const path = require('path');
const { ApiResponse } = require('../dto/response/ApiResponse');
const uploadService = require('../services/uploadService');
const {
  uploadSingle,
  uploadImages,
  uploadDocuments,
  uploadVehiclePhotos,
  uploadProfile,
  uploadDriverLicense,
  uploadVehicleDocs
} = require('../middleware/upload');

class UploadController {
  static async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.error(res, 'No file uploaded', 400);
      }

      const result = await uploadService.uploadFromBuffer(req.file.buffer, {
        folder: 'carpooling/uploads'
      });

      return ApiResponse.success(res, {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type
      }, 'File uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadMultipleFiles(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return ApiResponse.error(res, 'No files uploaded', 400);
      }

      const uploadPromises = req.files.map(file => 
        uploadService.uploadFromBuffer(file.buffer, {
          folder: 'carpooling/uploads'
        })
      );

      const results = await Promise.all(uploadPromises);

      const files = results.map(result => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type
      }));

      return ApiResponse.success(res, { files }, 'Files uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadProfileImage(req, res, next) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return ApiResponse.error(res, 'No profile image uploaded', 400);
      }

      const result = await uploadService.uploadUserProfile(
        req.file.buffer,
        userId,
        { transformation: [
          { width: 500, height: 500, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]}
      );

      return ApiResponse.success(res, {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height
      }, 'Profile image uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadVehicleImage(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const { type = 'photo' } = req.query;

      if (!req.file) {
        return ApiResponse.error(res, 'No vehicle image uploaded', 400);
      }

      const result = await uploadService.uploadVehicleImage(
        req.file.buffer,
        vehicleId,
        type,
        { transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]}
      );

      return ApiResponse.success(res, {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height
      }, 'Vehicle image uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadVehicleImages(req, res, next) {
    try {
      const { vehicleId } = req.params;

      if (!req.files || req.files.length === 0) {
        return ApiResponse.error(res, 'No vehicle images uploaded', 400);
      }

      const uploadPromises = req.files.map((file, index) =>
        uploadService.uploadVehicleImage(
          file.buffer,
          vehicleId,
          `photo_${index + 1}`
        )
      );

      const results = await Promise.all(uploadPromises);

      const images = results.map((result, index) => ({
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        index: index + 1
      }));

      return ApiResponse.success(res, { images }, 'Vehicle images uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async uploadDriverDocument(req, res, next) {
    try {
      const driverId = req.user.id;
      const { documentType } = req.body;

      if (!req.file) {
        return ApiResponse.error(res, 'No document uploaded', 400);
      }

      if (!documentType) {
        return ApiResponse.error(res, 'Document type is required', 400);
      }

      const result = await uploadService.uploadDriverDocument(
        req.file.buffer,
        driverId,
        documentType
      );

      return ApiResponse.success(res, {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes
      }, 'Document uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteUploadedFile(req, res, next) {
    try {
      const { publicId } = req.params;
      const { resourceType = 'image' } = req.query;

      const result = await uploadService.deleteFile(publicId, resourceType);

      if (result.result !== 'ok') {
        return ApiResponse.error(res, 'File not found or already deleted', 404);
      }

      return ApiResponse.success(res, { deleted: true }, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteMultipleFiles(req, res, next) {
    try {
      const { publicIds } = req.body;
      const { resourceType = 'image' } = req.query;

      if (!publicIds || !Array.isArray(publicIds)) {
        return ApiResponse.error(res, 'publicIds array is required', 400);
      }

      const result = await uploadService.deleteMultipleFiles(publicIds, resourceType);

      return ApiResponse.success(res, { deleted: result }, 'Files deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getFileMetadata(req, res, next) {
    try {
      const { publicId } = req.params;
      const { resourceType = 'image' } = req.query;

      const metadata = await uploadService.getResourceMetadata(publicId, resourceType);

      return ApiResponse.success(res, {
        publicId: metadata.public_id,
        url: metadata.secure_url,
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        bytes: metadata.bytes,
        createdAt: metadata.created_at
      }, 'File metadata retrieved');
    } catch (error) {
      if (error.http_code === 404) {
        return ApiResponse.error(res, 'File not found', 404);
      }
      next(error);
    }
  }

  static async getOptimizedImage(req, res, next) {
    try {
      const { publicId } = req.params;
      const { width, height, crop, gravity } = req.query;

      const optimizedUrl = uploadService.getOptimizedImageUrl(publicId, {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined,
        crop,
        gravity
      });

      return ApiResponse.success(res, {
        url: optimizedUrl
      }, 'Optimized image URL generated');
    } catch (error) {
      next(error);
    }
  }

  static async getThumbnail(req, res, next) {
    try {
      const { publicId } = req.params;
      const { width, height } = req.query;

      const thumbnailUrl = uploadService.getThumbnailUrl(publicId, {
        width: width ? parseInt(width) : undefined,
        height: height ? parseInt(height) : undefined
      });

      return ApiResponse.success(res, {
        url: thumbnailUrl
      }, 'Thumbnail URL generated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = {
  UploadController,
  uploadFile: UploadController.uploadFile,
  uploadMultipleFiles: UploadController.uploadMultipleFiles,
  uploadProfileImage: UploadController.uploadProfileImage,
  uploadVehicleImage: UploadController.uploadVehicleImage,
  uploadVehicleImages: UploadController.uploadVehicleImages,
  uploadDriverDocument: UploadController.uploadDriverDocument,
  deleteUploadedFile: UploadController.deleteUploadedFile,
  deleteMultipleFiles: UploadController.deleteMultipleFiles,
  getFileMetadata: UploadController.getFileMetadata,
  getOptimizedImage: UploadController.getOptimizedImage,
  getThumbnail: UploadController.getThumbnail
};
