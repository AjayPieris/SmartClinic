// =============================================================================
// DoctorsController.cs — Public-ish endpoints for browsing doctors.
// GET /api/doctors           — list all active doctors (patients need this)
// GET /api/doctors/{id}/booked-slots — slots already taken on a given date
// =============================================================================

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DoctorsController : ControllerBase
{
    private readonly AppDbContext _db;

    public DoctorsController(AppDbContext db) => _db = db;

    // GET /api/doctors
    // Returns every active doctor with their profile and availability.
    // Patients use this to populate the DoctorPicker step.
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
                d.AvailabilityJson,    // Sent as-is; React parses it
                FullName = $"{d.User.FirstName} {d.User.LastName}",
                d.User.ProfilePictureUrl,
                d.User.Email,
            })
            .OrderBy(d => d.FullName)
            .ToListAsync();

        return Ok(doctors);
    }

    // GET /api/doctors/{id}/booked-slots?date=2025-03-22
    // Returns non-cancelled appointments for this doctor on the given UTC date.
    // Used by the React slot generator to subtract booked windows.
    [HttpGet("{id:guid}/booked-slots")]
    [Authorize(Roles = "Patient,Admin")]
    public async Task<IActionResult> GetBookedSlots(Guid id, [FromQuery] string date)
    {
        // Parse the date string and build a UTC day range
        if (!DateOnly.TryParse(date, out var parsedDate))
            return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });

        // Build UTC range for the calendar day
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
}