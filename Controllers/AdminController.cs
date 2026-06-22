using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;
using SmartClinic.API.DTOs.Admin;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<AdminController> _logger;

    public AdminController(AppDbContext db, ILogger<AdminController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role,
        [FromQuery] string? status,
        [FromQuery] string? search)
    {
        var query = _db.Users
            .AsNoTracking()
            .Include(u => u.DoctorProfile)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(u => u.Role == role);

        if (!string.IsNullOrWhiteSpace(status))
        {
            var isActive = status.Equals("active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(u => u.IsActive == isActive);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                u.FirstName.ToLower().Contains(searchLower) ||
                u.LastName.ToLower().Contains(searchLower) ||
                u.Email.ToLower().Contains(searchLower));
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Select(u => new AdminUserListDto
            {
                Id = u.Id,
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                Role = u.Role,
                ProfilePictureUrl = u.ProfilePictureUrl,
                CreatedAtUtc = u.CreatedAtUtc,
                IsActive = u.IsActive,
                Specialization = u.DoctorProfile != null ? u.DoctorProfile.Specialization : null,
                VerificationStatus = u.DoctorProfile != null
                    ? u.DoctorProfile.VerificationStatus.ToString()
                    : null,
                IsVerified = u.DoctorProfile != null
                    ? u.DoctorProfile.VerificationStatus == Data.Models.VerificationStatus.Approved
                    : null,
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("users/{id:guid}/block")]
    public async Task<IActionResult> BlockUser(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        if (user.Role == "Admin")
            return BadRequest(new { message = "Cannot block an admin account." });

        user.IsActive = false;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Admin blocked user {UserId} ({Email})", user.Id, user.Email);
        return Ok(new { message = $"{user.FirstName} {user.LastName} has been blocked." });
    }

    [HttpPatch("users/{id:guid}/unblock")]
    public async Task<IActionResult> UnblockUser(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        user.IsActive = true;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Admin unblocked user {UserId} ({Email})", user.Id, user.Email);
        return Ok(new { message = $"{user.FirstName} {user.LastName} has been unblocked." });
    }

    [HttpGet("doctors")]
    public async Task<IActionResult> GetAllDoctors([FromQuery] string? verificationStatus)
    {
        var query = _db.DoctorProfiles
            .AsNoTracking()
            .Include(d => d.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(verificationStatus) &&
            Enum.TryParse<VerificationStatus>(verificationStatus, true, out var parsedStatus))
        {
            query = query.Where(d => d.VerificationStatus == parsedStatus);
        }

        var doctors = await query
            .OrderByDescending(d => d.User.CreatedAtUtc)
            .Select(d => new AdminDoctorDetailDto
            {
                DoctorProfileId = d.Id,
                UserId = d.UserId,
                FirstName = d.User.FirstName,
                LastName = d.User.LastName,
                Email = d.User.Email,
                ProfilePictureUrl = d.User.ProfilePictureUrl,
                IsActive = d.User.IsActive,
                CreatedAtUtc = d.User.CreatedAtUtc,
                Specialization = d.Specialization,
                LicenseNumber = d.LicenseNumber,
                Bio = d.Bio,
                VerificationStatus = d.VerificationStatus.ToString(),
                VerificationDocumentUrl = d.VerificationDocumentUrl,
                RejectionReason = d.RejectionReason,
                IsVerified = d.VerificationStatus == Data.Models.VerificationStatus.Approved,
                VerifiedAtUtc = d.VerifiedAtUtc,
            })
            .ToListAsync();

        return Ok(doctors);
    }

    [HttpGet("doctors/pending")]
    public async Task<IActionResult> GetPendingDoctors()
    {
        var doctors = await _db.DoctorProfiles
            .AsNoTracking()
            .Include(d => d.User)
            .Where(d => d.VerificationStatus == VerificationStatus.Pending)
            .OrderBy(d => d.User.CreatedAtUtc)
            .Select(d => new AdminDoctorDetailDto
            {
                DoctorProfileId = d.Id,
                UserId = d.UserId,
                FirstName = d.User.FirstName,
                LastName = d.User.LastName,
                Email = d.User.Email,
                ProfilePictureUrl = d.User.ProfilePictureUrl,
                IsActive = d.User.IsActive,
                CreatedAtUtc = d.User.CreatedAtUtc,
                Specialization = d.Specialization,
                LicenseNumber = d.LicenseNumber,
                Bio = d.Bio,
                VerificationStatus = d.VerificationStatus.ToString(),
                VerificationDocumentUrl = d.VerificationDocumentUrl,
                RejectionReason = null,
                IsVerified = false,
                VerifiedAtUtc = null,
            })
            .ToListAsync();

        return Ok(doctors);
    }

    [HttpPatch("doctors/{doctorProfileId:guid}/approve")]
    public async Task<IActionResult> ApproveDoctor(Guid doctorProfileId)
    {
        var doctor = await _db.DoctorProfiles
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == doctorProfileId);

        if (doctor is null)
            return NotFound(new { message = "Doctor profile not found." });

        doctor.VerificationStatus = VerificationStatus.Approved;
        doctor.VerifiedAtUtc = DateTime.UtcNow;
        doctor.RejectionReason = null;
        doctor.User.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Admin approved doctor {DoctorId} ({Email})",
            doctor.Id, doctor.User.Email);

        return Ok(new { message = $"Dr. {doctor.User.FirstName} {doctor.User.LastName} has been approved and verified." });
    }

    [HttpPatch("doctors/{doctorProfileId:guid}/reject")]
    public async Task<IActionResult> RejectDoctor(
        Guid doctorProfileId,
        [FromBody] RejectDoctorRequestDto request)
    {
        var doctor = await _db.DoctorProfiles
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == doctorProfileId);

        if (doctor is null)
            return NotFound(new { message = "Doctor profile not found." });

        doctor.VerificationStatus = VerificationStatus.Rejected;
        doctor.RejectionReason = request.RejectionReason?.Trim();
        doctor.VerifiedAtUtc = null;
        doctor.User.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Admin rejected doctor {DoctorId} ({Email}). Reason: {Reason}",
            doctor.Id, doctor.User.Email, request.RejectionReason ?? "No reason given");

        return Ok(new { message = $"Dr. {doctor.User.FirstName} {doctor.User.LastName} has been rejected." });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalUsers = await _db.Users.CountAsync();
        var activePatients = await _db.Users.CountAsync(u => u.Role == "Patient" && u.IsActive);
        var verifiedDoctors = await _db.DoctorProfiles
            .CountAsync(d => d.VerificationStatus == VerificationStatus.Approved);
        var pendingApproval = await _db.DoctorProfiles
            .CountAsync(d => d.VerificationStatus == VerificationStatus.Pending);
        var blockedUsers = await _db.Users.CountAsync(u => !u.IsActive);

        return Ok(new
        {
            totalUsers,
            activePatients,
            verifiedDoctors,
            pendingApproval,
            blockedUsers,
        });
    }
}
