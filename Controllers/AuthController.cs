// =============================================================================
// AuthController.cs — Public endpoints for registration and login.
// No [Authorize] attribute here — these routes are fully public.
//
// Error handling pattern:
//   - InvalidOperationException  → 400 Bad Request (client error, e.g. dup email)
//   - UnauthorizedAccessException → 401 Unauthorized (wrong credentials)
//   - All other exceptions        → caught by GlobalExceptionMiddleware → 500
// =============================================================================

using Microsoft.AspNetCore.Mvc;
using SmartClinic.API.DTOs.Auth;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        // ModelState validation runs automatically due to [ApiController]
        // If DataAnnotations fail, 400 is returned before we even get here
        try
        {
            var result = await _authService.RegisterAsync(request);
            // 201 Created with the auth token — client can log in immediately
            return CreatedAtAction(nameof(Register), result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            // Generic message to client — never reveal which field was wrong
            return Unauthorized(new { message = ex.Message });
        }
    }
}