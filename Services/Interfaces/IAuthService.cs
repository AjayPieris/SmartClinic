// =============================================================================
// IAuthService.cs — Contract for the authentication service.
// Programming to interfaces allows us to swap implementations or mock
// in unit tests without touching the controller layer.
// =============================================================================

using SmartClinic.API.DTOs.Auth;

namespace SmartClinic.API.Services.Interfaces;

public interface IAuthService
{
    // Returns AuthResponseDto (with JWT) on success,
    // throws InvalidOperationException if email is already registered.
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request);

    // Returns AuthResponseDto on success,
    // throws UnauthorizedAccessException on bad credentials.
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
}