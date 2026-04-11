const { vehicleDocumentService } = require('../services');
const { uploadService } = require('../services');
const { BadRequestException } = require('../exceptions');
const { ApiResponse } = require('../dto/response/ApiResponse');

class VehicleDocumentController {
  async uploadDocument(req, res, next) {
    try {
      const { userId } = req.user;
      const { vehicleId, documentType, expiresAt } = req.body;

      if (!req.file) {
        throw BadRequestException('No file uploaded');
      }

      const uploadResults = await uploadService.uploadVehicleDocuments(
        [req.file],
        vehicleId,
        [documentType]
      );

      if (!uploadResults || uploadResults.length === 0 || !uploadResults[0]) {
        throw BadRequestException('File upload failed');
      }

      const document = await vehicleDocumentService.uploadDocument(
        userId,
        parseInt(vehicleId),
        documentType,
        uploadResults[0].secure_url || uploadResults[0].url,
        expiresAt ? new Date(expiresAt) : null
      );

      return ApiResponse.created(res, document, 'Vehicle document uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  async uploadMultipleDocuments(req, res, next) {
    try {
      const { userId } = req.user;
      const { vehicleId, documentTypes, expiresAt } = req.body;

      if (!req.files || req.files.length === 0) {
        throw BadRequestException('No files uploaded');
      }

      let documentTypesArray = [];
      if (documentTypes) {
        try {
          documentTypesArray = typeof documentTypes === 'string' ? JSON.parse(documentTypes) : documentTypes;
        } catch (parseError) {
          throw BadRequestException('Invalid document types format');
        }
      }

      const uploadResults = await uploadService.uploadVehicleDocuments(
        req.files,
        vehicleId,
        documentTypesArray
      );

      if (!uploadResults || uploadResults.length === 0) {
        throw BadRequestException('File upload failed');
      }

      const documents = [];
      for (let i = 0; i < uploadResults.length; i++) {
        const result = uploadResults[i];
        if (!result) continue;
        
        const docType = documentTypesArray[i] || 'document';
        let expiryDate = null;
        if (expiresAt) {
          try {
            const expiryValue = Array.isArray(expiresAt) ? expiresAt[i] : expiresAt;
            expiryDate = expiryValue ? new Date(expiryValue) : null;
          } catch (dateError) {
            expiryDate = null;
          }
        }

        const document = await vehicleDocumentService.uploadDocument(
          userId,
          parseInt(vehicleId),
          docType,
          result.secure_url || result.url,
          expiryDate
        );
        documents.push(document);
      }

      return ApiResponse.created(res, documents, `${documents.length} vehicle documents uploaded successfully`);
    } catch (error) {
      next(error);
    }
  }

  async getVehicleDocuments(req, res, next) {
    try {
      const { userId } = req.user;
      const { vehicleId } = req.params;

      const documents = await vehicleDocumentService.getVehicleDocuments(
        parseInt(vehicleId),
        userId
      );
      const status = await vehicleDocumentService.getDocumentStatus(parseInt(vehicleId));

      return ApiResponse.success(res, {
        documents,
        ...status
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyVehicleDocuments(req, res, next) {
    try {
      const { userId } = req.user;
      const documents = await vehicleDocumentService.getMyVehicleDocuments(userId);

      return ApiResponse.success(res, documents);
    } catch (error) {
      next(error);
    }
  }

  async getDocument(req, res, next) {
    try {
      const { userId, role } = req.user;
      const { documentId } = req.params;
      const document = await vehicleDocumentService.getDocumentById(parseInt(documentId), userId, role);

      return ApiResponse.success(res, document);
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      const { userId } = req.user;
      const { documentId } = req.params;

      await vehicleDocumentService.deleteDocument(parseInt(documentId), userId);

      return ApiResponse.success(res, null, 'Document deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async submitForReview(req, res, next) {
    try {
      const { userId } = req.user;
      const { vehicleId } = req.params;

      const result = await vehicleDocumentService.submitForReview(
        parseInt(vehicleId),
        userId
      );

      return ApiResponse.success(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async getDocumentStatus(req, res, next) {
    try {
      const { vehicleId } = req.params;
      const status = await vehicleDocumentService.getDocumentStatus(parseInt(vehicleId));

      return ApiResponse.success(res, status);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VehicleDocumentController();
