// =============================================================================
// UploadProfilePictureRequestDto.cs — Inbound payload for avatar uploads.
// Simpler than document upload — no name, no appointment link.
// =============================================================================

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SmartClinic.API.DTOs.Documents;

public class UploadProfilePictureRequestDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
}