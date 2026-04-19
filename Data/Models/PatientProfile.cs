

namespace SmartClinic.API.Data.Models;

public class PatientProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign key back to the User table (1-to-1)
    public Guid UserId { get; set; }

    // Optional medical history fields — all nullable (patients fill these in later)
    public DateTime? DateOfBirth { get; set; }
    public string? BloodType { get; set; }
    public string? Allergies { get; set; }
    public string? MedicalHistory { get; set; }

    // Emergency contact info
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }

    // -------------------------------------------------------------------------
    // Navigation properties
    // -------------------------------------------------------------------------
    public User User { get; set; } = null!;

    // All appointments booked by this patient
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();

    // All medical documents uploaded by this patient
    public ICollection<MedicalDocument> MedicalDocuments { get; set; } = new List<MedicalDocument>();
}