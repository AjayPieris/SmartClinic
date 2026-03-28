// =============================================================================
// DoctorProfile.cs — Extended profile data specific to doctors.
// Linked 1-to-1 with User. Created immediately after a Doctor registers.
// AvailabilityJson stores the doctor's weekly schedule as a serialized
// list of time slots, avoiding a separate join table for simplicity.
// =============================================================================

namespace SmartClinic.API.Data.Models;

public class DoctorProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign key back to the User table (1-to-1)
    public Guid UserId { get; set; }

    public string Specialization { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }

    // Consultation duration in minutes (e.g. 30, 45, 60)
    // Used by the scheduling algorithm to block the correct time window
    public int ConsultationDurationMinutes { get; set; } = 30;

    // JSON blob: List<AvailabilitySlot> serialized by EF Core value converter.
    // Format: [{ "DayOfWeek": 1, "StartTimeUtc": "09:00", "EndTimeUtc": "17:00" }]
    // Stored as TEXT in Postgres — flexible, no extra migration on schema change.
    public string AvailabilityJson { get; set; } = "[]";

    // -------------------------------------------------------------------------
    // Navigation properties
    // -------------------------------------------------------------------------
    public User User { get; set; } = null!;

    // All appointments booked with this doctor
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}