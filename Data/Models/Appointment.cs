

namespace SmartClinic.API.Data.Models;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign keys
    public Guid DoctorProfileId { get; set; }
    public Guid PatientProfileId { get; set; }

    // Appointment window — both in UTC
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }

    // Status flow: Pending → Confirmed → Completed | Cancelled
    public AppointmentStatus Status { get; set; } = AppointmentStatus.Pending;

    // Optional notes added by the doctor post-consultation
    public string? DoctorNotes { get; set; }

    // Reason submitted by the patient at booking time
    public string? PatientReason { get; set; }

    // Telehealth vs In-Person flag
    public bool IsTelehealth { get; set; } = true;

    // Audit timestamps
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // EF Core optimistic concurrency token.
    // [Timestamp] maps to a PostgreSQL xmin column (rowversion equivalent).
    [System.ComponentModel.DataAnnotations.Timestamp]
    public uint RowVersion { get; set; }

    // -------------------------------------------------------------------------
    // Navigation properties
    // -------------------------------------------------------------------------
    public DoctorProfile DoctorProfile { get; set; } = null!;
    public PatientProfile PatientProfile { get; set; } = null!;

    // All chat messages exchanged during this appointment's telehealth session
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}

// Strongly-typed status enum stored as int in the database
public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 1,
    Completed = 2,
    Cancelled = 3
}