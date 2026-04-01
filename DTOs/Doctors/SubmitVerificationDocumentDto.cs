// =============================================================================
// SubmitVerificationDocumentDto.cs
// =============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Doctors;

public class SubmitVerificationDocumentDto
{
    [Required(ErrorMessage = "Please provide a valid document URL.")]
    [Url(ErrorMessage = "Must be a valid URL.")]
    [MaxLength(1000, ErrorMessage = "URL cannot exceed 1000 characters.")]
    public string DocumentUrl { get; set; } = string.Empty;
}
