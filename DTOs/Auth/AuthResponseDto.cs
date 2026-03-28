// DTOs/Auth/AuthResponseDto.cs
// =============================================================================
// Outbound payload returned after successful login or registration.
// Contains the JWT token and minimal user info for the React Context.
// =============================================================================

namespace SmartClinic.API.DTOs.Auth;

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string TokenExpiry { get; set; } = string.Empty; // ISO 8601 UTC string
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}