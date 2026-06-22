using Microsoft.AspNetCore.Http;
using SmartClinic.API.DTOs.Documents;

namespace SmartClinic.API.Services.Interfaces;

public interface IDocumentService
{
    Task<MedicalDocumentDto> UploadDocumentAsync(
        UploadDocumentRequestDto request, Guid patientUserId);

    Task<IEnumerable<MedicalDocumentDto>> GetPatientDocumentsAsync(Guid patientUserId);

    Task DeleteDocumentAsync(Guid documentId, Guid requestingUserId, string requestingUserRole);

    Task<string> UploadProfilePictureAsync(IFormFile file, Guid userId);
}