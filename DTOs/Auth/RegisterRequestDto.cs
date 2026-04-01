// DTOs/Auth/RegisterRequestDto.cs
// =============================================================================
// Inbound payload for POST /api/auth/register
// DataAnnotations provide server-side validation — ModelState.IsValid
// will be false automatically if these rules are violated.
// =============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Auth;

public class RegisterRequestDto
{
    [Required] [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required] [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required] [EmailAddress]
    public string Email { get; set; } = string.Empty;

    // Enforces: min 8 chars, at least one uppercase, one digit, one special char
    [Required]
    [RegularExpression(@"^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$",
        ErrorMessage = "Password must be 8+ chars with uppercase, digit, and special character.")]
    public string Password { get; set; } = string.Empty;

    // Validated against allowed values in the service layer
    [Required]
    public string Role { get; set; } = "Patient"; // "Patient" | "Doctor"

    [MaxLength(200, ErrorMessage = "Specialization cannot exceed 200 characters.")]
    public string? Specialization { get; set; }

    [MaxLength(100, ErrorMessage = "License number cannot exceed 100 characters.")]
    public string? LicenseNumber { get; set; }

    [Url(ErrorMessage = "Please provide a valid URL for the verification document.")]
    [MaxLength(1000, ErrorMessage = "Document URL cannot exceed 1000 characters.")]
    public string? VerificationDocumentUrl { get; set; }
}