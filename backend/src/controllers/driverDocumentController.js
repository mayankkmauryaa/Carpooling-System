const { driverDocumentService } = require('../services');
const { uploadService } = require('../services');
const { BadRequestException } = require('../exceptions');
const { ApiResponse } = require('../dto/response/ApiResponse');

class DriverDocumentController {
  async uploadDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentType, expiresAt } = req.body;

      if (!req.file) {
        throw BadRequestException('No file uploaded');
      }

      const uploadResult = await uploadService.uploadDriverDocument(
        req.file.buffer,
        userId,
        documentType
      );

      const document = await driverDocumentService.uploadDocument(
        userId,
        documentType,
        uploadResult.secure_url,
        expiresAt ? new Date(expiresAt) : null,
        role
      );

      return ApiResponse.created(res, document, 'Document uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyDocuments(req, res, next) {
    try {
      const { userId } = req.user;
      const documents = await driverDocumentService.getMyDocuments(userId);
      const status = await driverDocumentService.getDocumentStatus(userId);

      return ApiResponse.success(res, {
        documents,
        ...status
      });
    } catch (error) {
      next(error);
    }
  }

  async getDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const document = await driverDocumentService.getDocumentById(parseInt(documentId), userId, role);

      return ApiResponse.success(res, document);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { userId } = req.user;
      const { documentId } = req.params;

      await driverDocumentService.deleteDocument(parseInt(documentId), userId);

      return ApiResponse.success(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitForReview(req, res, next) {
    try {
      const { userId } = req.user;
      const result = await driverDocumentService.submitForReview(userId);

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getDocumentStatus(req, res, next) {
    try {
      const { userId } = req.user;
      const status = await driverDocumentService.getDocumentStatus(userId);

      return ApiResponse.success(res, status);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DriverDocumentController();
