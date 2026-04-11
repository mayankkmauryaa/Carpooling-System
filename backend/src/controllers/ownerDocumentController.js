const { ownerDocumentService } = require('../services');
const { uploadService } = require('../services');
const { ownerService } = require('../services');
const { BadRequestException, NotFoundException } = require('../exceptions');
const { ApiResponse } = require('../dto/response/ApiResponse');

class OwnerDocumentController {
  async uploadDocument(req, res, next) {
    try {
      const { userId } = req.user;
      const { documentType, expiresAt } = req.body;

      if (!req.file) {
        throw BadRequestException('No file uploaded');
      }

      const owner = await ownerService.getMyOwnerProfile(userId);
      if (!owner) {
        throw NotFoundException('Owner profile not found. Please register as an owner first.');
      }

      const uploadResult = await uploadService.uploadOwnerDocument(
        req.file.buffer,
        userId,
        documentType
      );

      const document = await ownerDocumentService.uploadDocument(
        owner.id,
        documentType,
        uploadResult.secure_url,
        expiresAt ? new Date(expiresAt) : null
      );

      return ApiResponse.created(res, document, 'Document uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  async getMyDocuments(req, res, next) {
    try {
      const { userId } = req.user;
      const owner = await ownerService.getMyOwnerProfile(userId);
      
      if (!owner) {
        throw NotFoundException('Owner profile not found. Please register as an owner first.');
      }
      
      const documents = await ownerDocumentService.getMyDocuments(owner.id);
      const status = await ownerDocumentService.getDocumentStatus(owner.id);

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
      const document = await ownerDocumentService.getDocumentById(parseInt(documentId), userId, role);

      return ApiResponse.success(res, document);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { userId } = req.user;
      const { documentId } = req.params;
      const owner = await ownerService.getMyOwnerProfile(userId);
      
      if (!owner) {
        throw NotFoundException('Owner profile not found. Please register as an owner first.');
      }

      await ownerDocumentService.deleteDocument(parseInt(documentId), owner.id);

      return ApiResponse.success(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitForReview(req, res, next) {
    try {
      const { userId } = req.user;
      const owner = await ownerService.getMyOwnerProfile(userId);
      
      if (!owner) {
        throw NotFoundException('Owner profile not found. Please register as an owner first.');
      }
      
      const result = await ownerDocumentService.submitForReview(owner.id);

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getDocumentStatus(req, res, next) {
    try {
      const { userId } = req.user;
      const owner = await ownerService.getMyOwnerProfile(userId);
      
      if (!owner) {
        throw NotFoundException('Owner profile not found. Please register as an owner first.');
      }
      
      const status = await ownerDocumentService.getDocumentStatus(owner.id);

      return ApiResponse.success(res, status);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OwnerDocumentController();
