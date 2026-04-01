// =============================================================================
// AdminDoctorDetailDto.cs — Full doctor details for admin verification panel.
// =============================================================================

namespace SmartClinic.API.DTOs.Admin;

public class AdminDoctorDetailDto
{
    public Guid DoctorProfileId { get; set; }
    public Guid UserId { get; set; }

    // User fields
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    // Doctor-specific fields
    public string Specialization { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }

    // Verification fields
    public string VerificationStatus { get; set; } = "Pending";
    public string? VerificationDocumentUrl { get; set; }
    public string? RejectionReason { get; set; }
    public bool IsVerified { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }
}
