using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;
using SmartClinic.API.DTOs.Documents;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services;

public class DocumentService : IDocumentService
{
    private readonly AppDbContext _db;
    private readonly ICloudinaryService _cloudinary;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(
        AppDbContext db,
        ICloudinaryService cloudinary,
        ILogger<DocumentService> logger)
    {
        _db = db;
        _cloudinary = cloudinary;
        _logger = logger;
    }

    public async Task<MedicalDocumentDto> UploadDocumentAsync(
        UploadDocumentRequestDto request, Guid patientUserId)
    {
        var patientProfile = await _db.PatientProfiles
            .FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Patient profile not found.");

        var folder = $"medical-docs/{patientProfile.Id}";
        CloudinaryUploadResult uploadResult;

        try
        {
            uploadResult = await _cloudinary.UploadFileAsync(request.File, folder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudinary upload failed for patient {PatientId}", patientProfile.Id);
            throw;
        }

        var document = new MedicalDocument
        {
            PatientProfileId = patientProfile.Id,
            AppointmentId = request.AppointmentId,
            DocumentName = request.DocumentName.Trim(),
            ContentType = request.File.ContentType,
            CloudinaryUrl = uploadResult.SecureUrl,
            CloudinaryPublicId = uploadResult.PublicId,
            FileSizeBytes = uploadResult.Bytes,
        };

        _db.MedicalDocuments.Add(document);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "DB write failed after Cloudinary upload. Cleaning up {PublicId}",
                uploadResult.PublicId);

            try { await _cloudinary.DeleteFileAsync(uploadResult.PublicId); }
            catch (Exception cleanupEx)
            {
                _logger.LogError(cleanupEx,
                    "Cloudinary cleanup also failed for {PublicId}. Manual cleanup required.",
                    uploadResult.PublicId);
            }

            throw;
        }

        _logger.LogInformation(
            "Document uploaded: {DocId} for patient {PatientId}, size {Size}",
            document.Id, patientProfile.Id, uploadResult.Bytes);

        return MapToDto(document);
    }

    public async Task<IEnumerable<MedicalDocumentDto>> GetPatientDocumentsAsync(Guid patientUserId)
    {
        var documents = await _db.MedicalDocuments
            .AsNoTracking()
            .Include(d => d.PatientProfile)
            .Where(d => d.PatientProfile.UserId == patientUserId)
            .OrderByDescending(d => d.UploadedAtUtc)
            .ToListAsync();

        return documents.Select(MapToDto);
    }

    public async Task DeleteDocumentAsync(
        Guid documentId, Guid requestingUserId, string requestingUserRole)
    {
        var document = await _db.MedicalDocuments
            .Include(d => d.PatientProfile)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new KeyNotFoundException("Document not found.");

        var isOwner = document.PatientProfile.UserId == requestingUserId;
        var isAdmin = requestingUserRole == "Admin";

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException("You are not authorized to delete this document.");

        var publicId = document.CloudinaryPublicId;

        _db.MedicalDocuments.Remove(document);
        await _db.SaveChangesAsync();

        try
        {
            await _cloudinary.DeleteFileAsync(publicId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Document {DocId} removed from DB but Cloudinary deletion failed for {PublicId}. " +
                "Manual cleanup may be needed.", documentId, publicId);
        }

        _logger.LogInformation(
            "Document {DocId} deleted by user {UserId}", documentId, requestingUserId);
    }

    public async Task<string> UploadProfilePictureAsync(IFormFile file, Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var oldPublicId = user.ProfilePictureUrl is not null
            ? ExtractPublicIdFromUrl(user.ProfilePictureUrl)
            : null;

        var folder = $"avatars/{userId}";
        var uploadResult = await _cloudinary.UploadFileAsync(file, folder);

        user.ProfilePictureUrl = uploadResult.SecureUrl;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (oldPublicId is not null)
        {
            try { await _cloudinary.DeleteFileAsync(oldPublicId); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Old profile picture cleanup failed for {PublicId}", oldPublicId);
            }
        }

        _logger.LogInformation("Profile picture updated for user {UserId}", userId);

        return uploadResult.SecureUrl;
    }

    private static MedicalDocumentDto MapToDto(MedicalDocument doc) => new()
    {
        Id = doc.Id,
        PatientProfileId = doc.PatientProfileId,
        AppointmentId = doc.AppointmentId,
        DocumentName = doc.DocumentName,
        ContentType = doc.ContentType,
        CloudinaryUrl = doc.CloudinaryUrl,
        FileSizeFormatted = FormatBytes(doc.FileSizeBytes),
        UploadedAtUtc = doc.UploadedAtUtc,
    };

    private static string? ExtractPublicIdFromUrl(string secureUrl)
    {
        try
        {
            var uri = new Uri(secureUrl);
            var segments = uri.AbsolutePath.Split('/');

            var uploadIndex = Array.IndexOf(segments, "upload");
            if (uploadIndex < 0) return null;

            var afterUpload = segments.Skip(uploadIndex + 2);
            var publicIdWithExt = string.Join("/", afterUpload);

            var dotIndex = publicIdWithExt.LastIndexOf('.');
            return dotIndex > 0 ? publicIdWithExt[..dotIndex] : publicIdWithExt;
        }
        catch
        {
            return null;
        }
    }

    private static string FormatBytes(long bytes) => bytes switch
    {
        < 1024 => $"{bytes} B",
        < 1024 * 1024 => $"{bytes / 1024.0:F1} KB",
        _ => $"{bytes / (1024.0 * 1024):F1} MB",
    };
}