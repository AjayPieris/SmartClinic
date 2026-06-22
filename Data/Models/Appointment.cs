

namespace SmartClinic.API.Data.Models;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DoctorProfileId { get; set; }
    public Guid PatientProfileId { get; set; }

    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }

    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

    public string? DoctorNotes { get; set; }

    public string? PatientReason { get; set; }

    public bool IsTelehealth { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    [System.ComponentModel.DataAnnotations.Timestamp]
    public uint RowVersion { get; set; }

    public DoctorProfile DoctorProfile { get; set; } = null!;
    public PatientProfile PatientProfile { get; set; } = null!;

    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}

public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 1,
    Completed = 2,
    Cancelled = 3
}