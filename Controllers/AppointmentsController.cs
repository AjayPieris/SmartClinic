// =============================================================================
// AppointmentsController.cs — Protected appointment endpoints.
//
// [Authorize] on the class means ALL endpoints require a valid JWT.
// Individual endpoints narrow down to specific roles using
// [Authorize(Roles = "Doctor")] etc.
//
// The requesting user's ID is extracted from the JWT claims — we never
// trust a userId passed in the request body from the client.
// =============================================================================

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartClinic.API.DTOs.Appointments;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // All routes require authentication
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _appointmentService;

    public AppointmentsController(IAppointmentService appointmentService)
    {
        _appointmentService = appointmentService;
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
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}

// Inline DTO for the PATCH status endpoint
public record UpdateStatusRequestDto(string Status);