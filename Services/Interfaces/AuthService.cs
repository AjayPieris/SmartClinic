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

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        var exists = await _db.Users.AnyAsync(u => u.Email == emailNormalized);
        if (exists)
            throw new InvalidOperationException("An account with this email already exists.");

        var allowedRoles = new[] { "Patient", "Doctor" };
        if (!allowedRoles.Contains(request.Role))
            throw new InvalidOperationException("Invalid role specified.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 12);

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = emailNormalized,
            PasswordHash = passwordHash,
            Role = request.Role,
        };

        _db.Users.Add(user);

        if (request.Role == "Doctor")
        {
            var doctorProfile = new DoctorProfile
            {
                UserId = user.Id,
                Specialization = request.Specialization?.Trim() ?? string.Empty,
                LicenseNumber = request.LicenseNumber?.Trim() ?? string.Empty,
                VerificationDocumentUrl = request.VerificationDocumentUrl?.Trim()
            };
            _db.DoctorProfiles.Add(doctorProfile);
        }
        else if (request.Role == "Patient")
        {
            var patientProfile = new PatientProfile { UserId = user.Id };
            _db.PatientProfiles.Add(patientProfile);
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("New {Role} registered: {Email}", user.Role, user.Email);

        return BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var emailNormalized = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == emailNormalized && u.IsActive);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        _logger.LogInformation("User logged in: {Email}", user.Email);

        return BuildAuthResponse(user);
    }

    private AuthResponseDto BuildAuthResponse(User user)
    {
        var expiry = DateTime.UtcNow.AddHours(8);
        var token = GenerateJwtToken(user, expiry);

        return new AuthResponseDto
        {
            Token = token,
            TokenExpiry = expiry.ToString("o"),
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Role = user.Role,
            ProfilePictureUrl = user.ProfilePictureUrl,
        };
    }

    private string GenerateJwtToken(User user, DateTime expiry)
    {
        var secret = _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT secret is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
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