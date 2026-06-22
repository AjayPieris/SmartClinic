using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Appointments;

public class BookAppointmentRequestDto
{
    [Required]
    public Guid DoctorProfileId { get; set; }

    [Required]
    public DateTime StartTimeUtc { get; set; }

    public string? PatientReason { get; set; }

    public bool IsTelehealth { get; set; } = true;
}