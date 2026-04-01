// =============================================================================
// DoctorsController.cs
// =============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;

using System.Security.Claims;
using System.Text.Json;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DoctorsController(AppDbContext db) => _db = db;

    // GET /api/doctors
    [HttpGet]
    [Authorize(Roles = "Patient,Admin")]
    public async Task<IActionResult> GetAllDoctors()
    {
        var doctors = await _db.DoctorProfiles
            .AsNoTracking()
            .Include(d => d.User)
            .Where(d => d.User.IsActive)
            .Select(d => new
            {
                d.Id,
                d.Specialization,
                d.LicenseNumber,
                d.Bio,
                d.ConsultationDurationMinutes,
                d.AvailabilityJson,
                FullName = d.User.FirstName + " " + d.User.LastName,
                d.User.ProfilePictureUrl,
                d.User.Email,
                IsVerified = d.VerificationStatus == Data.Models.VerificationStatus.Approved
            })
            .OrderBy(d => d.FullName)
            .ToListAsync();

        return Ok(doctors);
    }

    // GET /api/doctors/{id}/booked-slots
    [HttpGet("{id:guid}/booked-slots")]
    [Authorize(Roles = "Patient,Admin")]
    public async Task<IActionResult> GetBookedSlots(Guid id, [FromQuery] string date)
    {
        if (!DateOnly.TryParse(date, out var parsedDate))
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });

        var dayStart = parsedDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var dayEnd   = parsedDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var booked = await _db.Appointments
            .AsNoTracking()
            .Where(a =>
                a.DoctorProfileId == id &&
                a.Status != AppointmentStatus.Cancelled &&
                a.StartTimeUtc >= dayStart &&
                a.StartTimeUtc <= dayEnd)
            .Select(a => new { a.StartTimeUtc, a.EndTimeUtc })
            .ToListAsync();

        return Ok(booked);
    }

    // PATCH /api/doctors/availability
    [HttpPatch("availability")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> UpdateAvailability(
        [FromBody] UpdateAvailabilityDto request)
    {
        var userId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new InvalidOperationException("User ID claim missing."));

        var profile = await _db.DoctorProfiles
            .FirstOrDefaultAsync(d => d.UserId == userId);

        if (profile is null)
            return NotFound(new { message = "Doctor profile not found." });

        try
        {
            var parsed = JsonSerializer.Deserialize<List<AvailabilityWindowDto>>(
                request.AvailabilityJson);

            if (parsed is null)
                return BadRequest(new { message = "Invalid availability format." });

            foreach (var window in parsed)
            {
                if (!TimeOnly.TryParse(window.StartTime, out var start) ||
                    !TimeOnly.TryParse(window.EndTime, out var end))
                    return BadRequest(new
                    {
                        message = $"Invalid time format in window for day {window.DayOfWeek}."
                    });

                if (end <= start)
                    return BadRequest(new
                    {
                        message = $"End time must be after start time for day {window.DayOfWeek}."
                    });
            }

            if (request.ConsultationDurationMinutes < 5 ||
                request.ConsultationDurationMinutes > 240 ||
                request.ConsultationDurationMinutes % 5 != 0)
                return BadRequest(new
                {
                    message = "Consultation duration must be between 5 and 240 minutes, in multiples of 5."
                });
        }
        catch (JsonException)
        {
            return BadRequest(new { message = "Malformed availability JSON." });
        }

        profile.AvailabilityJson = request.AvailabilityJson;
        profile.ConsultationDurationMinutes = request.ConsultationDurationMinutes;

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // GET /api/doctors/me
    [HttpGet("me")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = Guid.Parse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var profile = await _db.DoctorProfiles
            .AsNoTracking()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.UserId == userId);

        if (profile is null) return NotFound();

        return Ok(new
        {
            profile.Id,
            profile.Specialization,
            profile.LicenseNumber,
            profile.Bio,
            profile.ConsultationDurationMinutes,
            profile.AvailabilityJson,
            FullName = profile.User.FirstName + " " + profile.User.LastName,
            profile.User.ProfilePictureUrl,
            profile.User.Email,
            VerificationStatus = profile.VerificationStatus.ToString(),
            profile.VerificationDocumentUrl,
            profile.RejectionReason
        });
    }

    // PATCH /api/doctors/me/verification-document
    [HttpPatch("me/verification-document")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> SubmitVerificationDocument([FromBody] DTOs.Doctors.SubmitVerificationDocumentDto request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var profile = await _db.DoctorProfiles.FirstOrDefaultAsync(d => d.UserId == userId);

        if (profile is null) return NotFound();

        profile.VerificationDocumentUrl = request.DocumentUrl;
        profile.VerificationStatus = Data.Models.VerificationStatus.Pending;
        profile.RejectionReason = null; // Clear previous rejection reasons

        await _db.SaveChangesAsync();

        return Ok(new { message = "Verification document submitted successfully. Pending admin approval." });
    }

    // DTOs
    public record UpdateAvailabilityDto(
        string AvailabilityJson,
        int ConsultationDurationMinutes
    );

    public record AvailabilityWindowDto(
        int DayOfWeek,
        string StartTime,
        string EndTime
    );
}