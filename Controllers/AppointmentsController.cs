

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.DTOs.Appointments;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All routes require authentication
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;
    private readonly AppDbContext _db;
    private readonly INotificationService _notificationService;

    public AppointmentsController(IAppointmentService appointmentService, AppDbContext db, INotificationService notificationService)
    {
        _appointmentService = appointmentService;
        _db = db;
        _notificationService = notificationService;
    }

    // Helper: extract the authenticated user's ID from JWT claims
    // This is always the canonical source — never trust body params for identity
    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim missing."));

    private string GetCurrentUserRole() =>
        User.FindFirstValue(ClaimTypes.Role)
            ?? throw new InvalidOperationException("Role claim missing.");

    // ------------------------------------------------------------------
    // POST /api/appointments — Patient books a new appointment
    // ------------------------------------------------------------------
    [HttpPost]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentRequestDto request)
    {
        try
        {
            var result = await _appointmentService.BookAppointmentAsync(request, GetCurrentUserId());
            return CreatedAtAction(nameof(BookAppointment), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            // Double-booking and concurrency conflicts come through here
            return Conflict(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ------------------------------------------------------------------
    // GET /api/appointments/my-schedule — Doctor sees their daily schedule
    // ------------------------------------------------------------------
    [HttpGet("my-schedule")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMySchedule()
    {
        var appointments = await _appointmentService.GetDoctorAppointmentsAsync(GetCurrentUserId());
        return Ok(appointments);
    }

    // ------------------------------------------------------------------
    // GET /api/appointments/my-appointments — Patient sees their bookings
    // ------------------------------------------------------------------
    [HttpGet("my-appointments")]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(IEnumerable<AppointmentResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyAppointments()
    {
        var appointments = await _appointmentService.GetPatientAppointmentsAsync(GetCurrentUserId());
        return Ok(appointments);
    }

    // ------------------------------------------------------------------
    // PATCH /api/appointments/{id}/status — Update appointment status
    // ------------------------------------------------------------------
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AppointmentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequestDto request)
    {
        try
        {
            var result = await _appointmentService.UpdateStatusAsync(
                id, request.Status, GetCurrentUserId(), GetCurrentUserRole());

            // --- Notification Trigger ---
            var appointment = await _db.Appointments
                .Include(a => a.DoctorProfile)
                .Include(a => a.PatientProfile)
                .FirstOrDefaultAsync(a => a.Id == id);
            
            if (appointment != null)
            {
                var currentUserId = GetCurrentUserId();
                var opponentUserId = currentUserId == appointment.DoctorProfile.UserId 
                    ? appointment.PatientProfile.UserId 
                    : appointment.DoctorProfile.UserId;

                var title = request.Status switch
                {
                    "Confirmed" => "Appointment Confirmed",
                    "Cancelled" => "Appointment Cancelled",
                    "Completed" => "Appointment Completed",
                    _ => $"Appointment status: {request.Status}"
                };

                var dateStr = result.StartTimeUtc.ToLocalTime().ToString("MMM dd, yyyy");
                var msg = request.Status switch
                {
                    "Confirmed" => $"Your appointment on {dateStr} has been confirmed.",
                    "Cancelled" => $"Your appointment on {dateStr} was cancelled.",
                    "Completed" => $"Dr. {result.DoctorFullName} completed your appointment on {dateStr}.",
                    _ => $"Status changed to {request.Status}."
                };

                await _notificationService.CreateNotificationAsync(
                    opponentUserId, title, msg, "Appointment", id);
            }

            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/notes")]
    [Authorize(Roles = "Doctor")]
    public async Task<IActionResult> UpdateNotes(Guid id, [FromBody] UpdateNotesRequestDto request)
    {
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment is null)
            return NotFound(new { message = "Appointment not found." });

        // Verify the requesting doctor owns this appointment
        var doctorUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (appointment.DoctorProfile.UserId != doctorUserId)
            return Forbid();

        appointment.DoctorNotes = request.Notes?.Trim();
        appointment.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent(); // 204 — success with no body
    }
}

// Inline DTO for the PATCH status endpoint
public record UpdateStatusRequestDto(string Status);

// Inline DTO for the notes endpoint
public record UpdateNotesRequestDto(string? Notes);