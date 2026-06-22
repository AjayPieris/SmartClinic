using Microsoft.AspNetCore.Http;

namespace SmartClinic.API.Services.Interfaces;

public interface ICloudinaryService
{
    Task<CloudinaryUploadResult> UploadFileAsync(IFormFile file, string folder);

    Task DeleteFileAsync(string publicId);
}

public record CloudinaryUploadResult(
    string SecureUrl,
    string PublicId,
    long Bytes
);