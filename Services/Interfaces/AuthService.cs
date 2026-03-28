// =============================================================================
// AuthService.cs — Handles registration and JWT token generation.
//
// Security decisions made here:
//   - BCrypt with work factor 12 (slows brute-force significantly)
//   - JWT signed with HS256 using a 256-bit secret from appsettings
//   - Role is embedded as a standard "role" claim so [Authorize(Roles="Doctor")]
//     works out of the box in controllers
//   - Tokens expire after 8 hours — refresh token flow is Phase 2+
// =============================================================================

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;
using SmartClinic.API.DTOs.Auth;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<AuthService> _logger;

    public AuthService(AppDbContext db, IConfiguration config, ILogger<AuthService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // RegisterAsync
    // -------------------------------------------------------------------------
    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Normalize email to lowercase to prevent case-sensitivity issues
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        // Check for duplicate email at the application layer
        // (the DB unique index is the final safety net, not the first check)
        var exists = await _db.Users.AnyAsync(u => u.Email == emailNormalized);
        if (exists)
            throw new InvalidOperationException("An account with this email already exists.");

        // Validate role — only Patient and Doctor can self-register
        // Admin accounts must be created by an existing Admin
        var allowedRoles = new[] { "Patient", "Doctor" };
        if (!allowedRoles.Contains(request.Role))
            throw new InvalidOperationException("Invalid role specified.");

        // Hash the password with BCrypt work factor 12
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

        // Create the base User record
        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = emailNormalized,
            PasswordHash = passwordHash,
            Role = request.Role,
        };

        _db.Users.Add(user);

        // Create the role-specific profile record in the same transaction
        if (request.Role == "Doctor")
        {
            var doctorProfile = new DoctorProfile
            {
                UserId = user.Id,
                Specialization = request.Specialization?.Trim() ?? string.Empty,
                LicenseNumber = request.LicenseNumber?.Trim() ?? string.Empty,
            };
            _db.DoctorProfiles.Add(doctorProfile);
        }
        else if (request.Role == "Patient")
        {
            var patientProfile = new PatientProfile { UserId = user.Id };
            _db.PatientProfiles.Add(patientProfile);
        }

        // SaveChanges writes both User + Profile in a single transaction
        await _db.SaveChangesAsync();

        _logger.LogInformation("New {Role} registered: {Email}", user.Role, user.Email);

        // Generate JWT and return the auth response
        return BuildAuthResponse(user);
    }

    // -------------------------------------------------------------------------
    // LoginAsync
    // -------------------------------------------------------------------------
    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        // Fetch user — we intentionally give the same vague error for
        // "not found" and "wrong password" to prevent user enumeration attacks
        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == emailNormalized && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        _logger.LogInformation("User logged in: {Email}", user.Email);

        return BuildAuthResponse(user);
    }

    // -------------------------------------------------------------------------
    // BuildAuthResponse — private helper to mint the JWT and build the DTO
    // -------------------------------------------------------------------------
    private AuthResponseDto BuildAuthResponse(User user)
    {
        var expiry = DateTime.UtcNow.AddHours(8);
        var token = GenerateJwtToken(user, expiry);

        return new AuthResponseDto
        {
            Token = token,
            TokenExpiry = expiry.ToString("o"), // ISO 8601 format
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            ProfilePictureUrl = user.ProfilePictureUrl,
        };
    }

    // -------------------------------------------------------------------------
    // GenerateJwtToken — creates a signed HS256 JWT
    // -------------------------------------------------------------------------
    private string GenerateJwtToken(User user, DateTime expiry)
    {
        // Read the signing secret from configuration
        // Must be at least 32 characters (256 bits) for HS256
        var secret = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT secret is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Claims are embedded IN the token — no DB lookup needed on each request
        var claims = new[]
        {
            // Standard claims
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),

            // Custom claims
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),

            // The "role" claim is what [Authorize(Roles="Doctor")] checks
            new Claim(ClaimTypes.Role, user.Role),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}