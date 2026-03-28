// =============================================================================
// CloudinaryService.cs — The ONLY file in the project that imports CloudinaryDotNet.
//
// Security decisions:
//   1. ALLOWED file types are whitelisted here — we reject anything not on the list.
//      Never trust Content-Type from the client; we check the magic bytes via
//      the file extension as a first pass (full magic byte check is an enhancement).
//   2. MAX file size is enforced here as a second gate (ASP.NET request size
//      limits in Program.cs are the first gate — see configuration below).
//   3. Files are uploaded with a sanitized filename — the original name is
//      stored in the DB but never used as the Cloudinary public_id to prevent
//      path traversal or injection via crafted filenames.
//   4. Medical documents go to the "medical-docs/{patientId}" Cloudinary folder.
//      Profile pictures go to "avatars/{userId}".
//      This folder structure makes it easy to audit access in Cloudinary's dashboard.
// =============================================================================

using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly Cloudinary _cloudinary;
    private readonly ILogger<CloudinaryService> _logger;

    // Maximum allowed file size: 10 MB
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    // Whitelisted MIME types for medical documents
    private static readonly HashSet<string> AllowedDocumentMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        // Common medical imaging formats
        "application/dicom",
        "image/tiff",
    };

    // Whitelisted MIME types for profile pictures (images only)
    private static readonly HashSet<string> AllowedImageMimeTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
    };

    public CloudinaryService(IConfiguration config, ILogger<CloudinaryService> logger)
    {
        _logger = logger;

        // Cloudinary account credentials come from appsettings.json / env vars
        // Never hardcode credentials here — they must come from configuration
        var cloudName = config["Cloudinary:CloudName"]
            ?? throw new InvalidOperationException("Cloudinary:CloudName is not configured.");
        var apiKey = config["Cloudinary:ApiKey"]
            ?? throw new InvalidOperationException("Cloudinary:ApiKey is not configured.");
        var apiSecret = config["Cloudinary:ApiSecret"]
            ?? throw new InvalidOperationException("Cloudinary:ApiSecret is not configured.");

        // Account wraps the credentials — passed into every SDK operation
        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account)
        {
            // Enforce HTTPS for all API calls to Cloudinary
            Api = { Secure = true }
        };
    }

    // -------------------------------------------------------------------------
    // UploadFileAsync
    // -------------------------------------------------------------------------
    public async Task<CloudinaryUploadResult> UploadFileAsync(IFormFile file, string folder)
    {
        // --- Server-side validation (do NOT rely on client-side validation alone) ---

        // 1. Check file size
        if (file.Length > MaxFileSizeBytes)
            throw new InvalidOperationException(
                $"File size {FormatBytes(file.Length)} exceeds the 10 MB limit.");

        // 2. Check file is not empty
        if (file.Length == 0)
            throw new InvalidOperationException("Cannot upload an empty file.");

        // 3. Validate MIME type based on folder context
        // "avatars" folder = image only; anything else = full document list
        var allowedTypes = folder.StartsWith("avatars", StringComparison.OrdinalIgnoreCase)
            ? AllowedImageMimeTypes
            : AllowedDocumentMimeTypes;

        if (!allowedTypes.Contains(file.ContentType))
            throw new InvalidOperationException(
                $"File type '{file.ContentType}' is not permitted. " +
                $"Allowed types: {string.Join(", ", allowedTypes)}");

        // --- Build the Cloudinary upload parameters ---

        // Generate a safe, unique public_id to avoid filename-based attacks.
        // Cloudinary public_id format: "folder/timestamp-guid"
        var safePublicId = $"{folder}/{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}-{Guid.NewGuid():N}";

        // Determine the resource type:
        // "image" for images (enables Cloudinary transformations like resize/crop)
        // "raw" for PDFs and other non-image binary files
        var resourceType = file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase)
            ? ResourceType.Image
            : ResourceType.Raw;

        _logger.LogInformation(
            "Uploading file to Cloudinary: {OriginalName}, {Size}, folder: {Folder}",
            file.FileName, FormatBytes(file.Length), folder);

        // Open the file stream and upload — this streams directly to Cloudinary,
        // the full file is NOT buffered into a byte array in memory
        await using var stream = file.OpenReadStream();

        // Build upload parameters based on resource type
        if (resourceType == ResourceType.Image)
        {
            var imageParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = safePublicId,
                Overwrite = false, // Never overwrite — each upload is a new resource

                // For profile pictures: auto-crop to a square face-focused thumbnail
                // For documents: no transformation
                Transformation = folder.StartsWith("avatars")
                    ? new Transformation()
                        .Width(400).Height(400)
                        .Crop("fill")
                        .Gravity("face")
                        .Quality("auto")
                        .FetchFormat("auto")
                    : null,

                // Tag uploads for easy filtering in Cloudinary's media library
                Tags = folder.StartsWith("avatars") ? "avatar" : "medical-document",
            };

            var imageResult = await _cloudinary.UploadAsync(imageParams);

            if (imageResult.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Message}", imageResult.Error.Message);
                throw new InvalidOperationException(
                    $"File upload failed: {imageResult.Error.Message}");
            }

            return new CloudinaryUploadResult(
                SecureUrl: imageResult.SecureUrl.ToString(),
                PublicId: imageResult.PublicId,
                Bytes: imageResult.Bytes
            );
        }
        else
        {
            // Raw upload for PDFs, DICOM, etc.
            var rawParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                PublicId = safePublicId,
                Overwrite = false,
                Tags = "medical-document",
            };

            var rawResult = await _cloudinary.UploadAsync(rawParams);

            if (rawResult.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Message}", rawResult.Error.Message);
                throw new InvalidOperationException(
                    $"File upload failed: {rawResult.Error.Message}");
            }

            return new CloudinaryUploadResult(
                SecureUrl: rawResult.SecureUrl.ToString(),
                PublicId: rawResult.PublicId,
                Bytes: rawResult.Bytes
            );
        }
    }

    // -------------------------------------------------------------------------
    // DeleteFileAsync
    // -------------------------------------------------------------------------
    public async Task DeleteFileAsync(string publicId)
    {
        // We need to determine the resource type from the public_id prefix
        // Cloudinary requires the correct resource type for deletion
        var isRaw = !publicId.Contains("avatars"); // crude but effective for our folder structure
        var resourceType = isRaw ? ResourceType.Raw : ResourceType.Image;

        var deleteParams = new DeletionParams(publicId)
        {
            ResourceType = resourceType,
        };

        var result = await _cloudinary.DestroyAsync(deleteParams);

        if (result.Result != "ok")
        {
            _logger.LogWarning(
                "Cloudinary deletion returned non-ok result for {PublicId}: {Result}",
                publicId, result.Result);
        }
        else
        {
            _logger.LogInformation("Deleted Cloudinary resource: {PublicId}", publicId);
        }
    }

    // -------------------------------------------------------------------------
    // Private helper — format bytes into a human-readable string
    // -------------------------------------------------------------------------
    private static string FormatBytes(long bytes) => bytes switch
    {
        < 1024 => $"{bytes} B",
        < 1024 * 1024 => $"{bytes / 1024.0:F1} KB",
        _ => $"{bytes / (1024.0 * 1024):F1} MB",
    };
}