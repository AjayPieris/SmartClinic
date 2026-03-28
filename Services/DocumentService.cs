// =============================================================================
// DocumentService.cs — Orchestrates Cloudinary uploads and DB persistence.
//
// Key design decisions:
//   1. Upload to Cloudinary FIRST, then write to DB.
//      If the DB write fails, we call DeleteFileAsync to clean up Cloudinary.
//      This avoids orphaned files (files in Cloudinary with no DB record).
//
//   2. Profile picture replacement: old URL is deleted from Cloudinary AFTER
//      the new upload succeeds and DB is updated. This prevents a window where
//      the user has no profile picture if the new upload fails.
//
//   3. Authorization is enforced in this service, not just the controller.
//      Defense-in-depth: even if a misconfigured route bypasses the controller
//      attribute, the service will reject unauthorized access.
// =============================================================================

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

    // -------------------------------------------------------------------------
    // UploadDocumentAsync
    // -------------------------------------------------------------------------
    public async Task<MedicalDocumentDto> UploadDocumentAsync(
        UploadDocumentRequestDto request, Guid patientUserId)
    {
        // 1. Resolve the patient's profile (needed for the folder path and FK)
        var patientProfile = await _db.PatientProfiles
            .FirstOrDefaultAsync(p => p.UserId == patientUserId)
            ?? throw new KeyNotFoundException("Patient profile not found.");

        // 2. Upload to Cloudinary first
        // Folder: "medical-docs/{patientProfileId}" — scoped per patient
        // This makes it easy to find all files for a patient in Cloudinary's dashboard
        var folder = $"medical-docs/{patientProfile.Id}";
        CloudinaryUploadResult uploadResult;

        try
        {
            uploadResult = await _cloudinary.UploadFileAsync(request.File, folder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudinary upload failed for patient {PatientId}", patientProfile.Id);
            throw; // Re-throw — controller will return 400 via GlobalExceptionMiddleware
        }

        // 3. Persist metadata to DB
        // If this fails, we must clean up the Cloudinary file to avoid orphans
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
            // DB write failed — delete the Cloudinary file to prevent orphaning
            _logger.LogError(ex,
                "DB write failed after Cloudinary upload. Cleaning up {PublicId}",
                uploadResult.PublicId);

            // Best-effort cleanup — if this also fails, log it but don't mask the original error
            try { await _cloudinary.DeleteFileAsync(uploadResult.PublicId); }
            catch (Exception cleanupEx)
            {
                _logger.LogError(cleanupEx,
                    "Cloudinary cleanup also failed for {PublicId}. Manual cleanup required.",
                    uploadResult.PublicId);
            }

            throw; // Re-throw the original DB exception
        }

        _logger.LogInformation(
            "Document uploaded: {DocId} for patient {PatientId}, size {Size}",
            document.Id, patientProfile.Id, uploadResult.Bytes);

        return MapToDto(document);
    }

    // -------------------------------------------------------------------------
    // GetPatientDocumentsAsync
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // DeleteDocumentAsync
    // -------------------------------------------------------------------------
    public async Task DeleteDocumentAsync(
        Guid documentId, Guid requestingUserId, string requestingUserRole)
    {
        // Load document with its patient profile for ownership verification
        var document = await _db.MedicalDocuments
            .Include(d => d.PatientProfile)
            .FirstOrDefaultAsync(d => d.Id == documentId)
            ?? throw new KeyNotFoundException("Document not found.");

        // Authorization: patients can only delete their own documents
        var isOwner = document.PatientProfile.UserId == requestingUserId;
        var isAdmin = requestingUserRole == "Admin";

        if (!isOwner && !isAdmin)
            throw new UnauthorizedAccessException(
                "You are not authorized to delete this document.");

        // Capture public_id before removing from DB
        var publicId = document.CloudinaryPublicId;

        // 1. Remove from DB first
        _db.MedicalDocuments.Remove(document);
        await _db.SaveChangesAsync();

        // 2. Delete from Cloudinary after DB success
        // If Cloudinary deletion fails, the file becomes orphaned in Cloudinary
        // but the DB record is gone — this is acceptable (Cloudinary costs pennies,
        // data consistency is more important). Log for periodic cleanup.
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

    // -------------------------------------------------------------------------
    // UploadProfilePictureAsync
    // -------------------------------------------------------------------------
    public async Task<string> UploadProfilePictureAsync(IFormFile file, Guid userId)
    {
        // Load the user — we need to know their existing picture URL for cleanup
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("User not found.");

        var oldPublicId = user.ProfilePictureUrl is not null
            ? ExtractPublicIdFromUrl(user.ProfilePictureUrl)
            : null;

        // Upload new image to Cloudinary
        // Folder: "avatars/{userId}" — one folder per user, easy to manage
        var folder = $"avatars/{userId}";
        var uploadResult = await _cloudinary.UploadFileAsync(file, folder);

        // Update the User record with the new URL
        user.ProfilePictureUrl = uploadResult.SecureUrl;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Delete the OLD profile picture AFTER the new one is saved
        // This ensures we never have a window where the user has no picture
        if (oldPublicId is not null)
        {
            try { await _cloudinary.DeleteFileAsync(oldPublicId); }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Old profile picture cleanup failed for {PublicId}", oldPublicId);
            }
        }

        _logger.LogInformation("Profile picture updated for user {UserId}", userId);

        // Return the new secure URL — React stores this in AuthContext
        return uploadResult.SecureUrl;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    // Map EF Core entity to outbound DTO
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

    // Extract the Cloudinary public_id from a secure_url
    // Cloudinary URLs follow: https://res.cloudinary.com/{cloud}/{type}/upload/{version}/{public_id}.{ext}
    // We need the public_id portion (without extension) for the deletion API.
    private static string? ExtractPublicIdFromUrl(string secureUrl)
    {
        try
        {
            var uri = new Uri(secureUrl);
            // Path segments example: ["", "mycloud", "image", "upload", "v123", "avatars", "userid", "filename.jpg"]
            var segments = uri.AbsolutePath.Split('/');

            // Find the "upload" segment index and take everything after it,
            // skipping the version segment (v1234567890)
            var uploadIndex = Array.IndexOf(segments, "upload");
            if (uploadIndex < 0) return null;

            // Join remaining segments after "upload" and the version number
            var afterUpload = segments.Skip(uploadIndex + 2); // +2 skips "upload" and version
            var publicIdWithExt = string.Join("/", afterUpload);

            // Strip the file extension — Cloudinary public_ids don't include it
            var dotIndex = publicIdWithExt.LastIndexOf('.');
            return dotIndex > 0 ? publicIdWithExt[..dotIndex] : publicIdWithExt;
        }
        catch
        {
            return null; // If URL is malformed, skip cleanup
        }
    }

    private static string FormatBytes(long bytes) => bytes switch
    {
        < 1024 => $"{bytes} B",
        < 1024 * 1024 => $"{bytes / 1024.0:F1} KB",
        _ => $"{bytes / (1024.0 * 1024):F1} MB",
    };
}