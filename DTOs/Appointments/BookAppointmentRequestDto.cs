// DTOs/Appointments/BookAppointmentRequestDto.cs
// =============================================================================
// Inbound payload for POST /api/appointments
// Times must be sent as UTC ISO 8601 strings from the React frontend.
// =============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Appointments;

public class BookAppointmentRequestDto
{
    [Required]
    public Guid DoctorProfileId { get; set; }

    // Must be a future UTC datetime
    [Required]
    public DateTime StartTimeUtc { get; set; }

    public string? PatientReason { get; set; }

    public bool IsTelehealth { get; set; } = true;
}