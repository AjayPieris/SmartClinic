// =============================================================================
// User.cs — The central identity record for ALL roles in the system.
// A single User row is created on registration. Role is stored as a string
// claim ("Patient", "Doctor", "Admin") and is embedded in the JWT token.
// =============================================================================

namespace SmartClinic.API.Data.Models;

public class User
{
    // Primary key — using Guid for security (no sequential integer leakage)
    public Guid Id { get; set; } = Guid.NewGuid();

    // Core identity fields
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // Must be unique — enforced by a unique index in AppDbContext
    public string Email { get; set; } = string.Empty;

    // BCrypt hash — we NEVER store plaintext passwords
    public string PasswordHash { get; set; } = string.Empty;

    // Role values: "Patient" | "Doctor" | "Admin"
    // Using a string (not an enum) so it maps cleanly to JWT role claims
    public string Role { get; set; } = "Patient";

    // Cloudinary URL for the profile picture — nullable until uploaded
    public string? ProfilePictureUrl { get; set; }

    // Audit timestamps — always stored in UTC
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // Soft delete — we never hard-delete medical data
    public bool IsActive { get; set; } = true;

    // -------------------------------------------------------------------------
    // Navigation properties (EF Core relationships)
    // -------------------------------------------------------------------------

    // One User → zero or one DoctorProfile (only exists if Role == "Doctor")
    public DoctorProfile? DoctorProfile { get; set; }

    // One User → zero or one PatientProfile (only exists if Role == "Patient")
    public PatientProfile? PatientProfile { get; set; }
}