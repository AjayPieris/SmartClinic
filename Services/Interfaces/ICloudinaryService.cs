// =============================================================================
// ICloudinaryService.cs — Contract for all Cloudinary operations.
//
// Abstracted behind an interface so:
//   a) Controllers and DocumentService never import CloudinaryDotNet directly
//   b) We can swap to a mock in unit tests without touching business logic
//   c) If we ever switch CDN providers, only this implementation changes
// =============================================================================

using Microsoft.AspNetCore.Http;

namespace SmartClinic.API.Services.Interfaces;

public interface ICloudinaryService
{
    /// <summary>
    /// Uploads a file to Cloudinary and returns the result metadata.
    /// </summary>
    /// <param name="file">The IFormFile stream from the HTTP request.</param>
    /// <param name="folder">The Cloudinary folder path (e.g. "medical-docs", "avatars").</param>
    /// <returns>Upload result containing secure_url and public_id.</returns>
    Task<CloudinaryUploadResult> UploadFileAsync(IFormFile file, string folder);

    /// <summary>
    /// Deletes a previously uploaded file from Cloudinary by its public_id.
    /// Called when a patient deletes a document or replaces their profile picture.
    /// </summary>
    Task DeleteFileAsync(string publicId);
}

// =============================================================================
// CloudinaryUploadResult — Internal result model (not exposed as a DTO).
// Carries just the two fields we store in the database from Cloudinary's
// much larger ImageUploadResult/RawUploadResult response object.
// =============================================================================
public record CloudinaryUploadResult(
    string SecureUrl,   // HTTPS CDN link — stored in DB, exposed in DTOs
    string PublicId,    // Cloudinary management key — stored in DB, never in DTOs
    long Bytes          // File size in bytes — stored in DB for UI display
);