// =============================================================================
// AdminUserListDto.cs — Summarized user details for the Admin dashboard.
// =============================================================================

namespace SmartClinic.API.DTOs.Admin;

public class AdminUserListDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public bool IsActive { get; set; }

    // Doctor-specific fields (null for patients/admins)
    public string? Specialization { get; set; }
    public string? VerificationStatus { get; set; }
    public bool? IsVerified { get; set; }
}
