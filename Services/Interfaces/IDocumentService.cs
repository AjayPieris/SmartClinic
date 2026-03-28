// =============================================================================
// IDocumentService.cs — Business logic contract for document management.
// Orchestrates between ICloudinaryService and the database.
// =============================================================================

using Microsoft.AspNetCore.Http;
using SmartClinic.API.DTOs.Documents;

namespace SmartClinic.API.Services.Interfaces;

public interface IDocumentService
{
    /// <summary>
    /// Uploads a medical document to Cloudinary and persists the metadata
    /// to the MedicalDocuments table. Returns the created record as a DTO.
    /// </summary>
    Task<MedicalDocumentDto> UploadDocumentAsync(
        UploadDocumentRequestDto request, Guid patientUserId);

    /// <summary>
    /// Retrieves all documents belonging to the authenticated patient.
    /// Doctors can retrieve documents for their patients via a separate overload.
    /// </summary>
    Task<IEnumerable<MedicalDocumentDto>> GetPatientDocumentsAsync(Guid patientUserId);

    /// <summary>
    /// Deletes a document from both Cloudinary and the database.
    /// Authorization (ownership check) is performed inside this method.
    /// </summary>
    Task DeleteDocumentAsync(Guid documentId, Guid requestingUserId, string requestingUserRole);

    /// <summary>
    /// Uploads a profile picture to Cloudinary and updates User.ProfilePictureUrl.
    /// If the user already has a profile picture, the old one is deleted from Cloudinary
    /// before uploading the new one — avoids orphaned files in the CDN.
    /// </summary>
    Task<string> UploadProfilePictureAsync(IFormFile file, Guid userId);
}