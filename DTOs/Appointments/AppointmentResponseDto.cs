// DTOs/Appointments/AppointmentResponseDto.cs
// =============================================================================
// Outbound payload for appointment reads.
// We flatten the navigation properties here so the frontend doesn't need
// to do multiple API calls to display a complete appointment card.
// =============================================================================

namespace SmartClinic.API.DTOs.Appointments;

public class AppointmentResponseDto
{
    public Guid Id { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsTelehealth { get; set; }
    public string? PatientReason { get; set; }
    public string? DoctorNotes { get; set; }

    // Doctor info (flattened)
    public Guid DoctorProfileId { get; set; }
    public string DoctorFullName { get; set; } = string.Empty;
    public string DoctorSpecialization { get; set; } = string.Empty;
    public string? DoctorProfilePictureUrl { get; set; }

    // Patient info (flattened)
    public Guid PatientProfileId { get; set; }
    public string PatientFullName { get; set; } = string.Empty;
    public string? PatientProfilePictureUrl { get; set; }
}