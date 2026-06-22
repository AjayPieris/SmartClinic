

namespace SmartClinic.API.Data.Models;

public class PatientProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public DateTime? DateOfBirth { get; set; }
    public string? BloodType { get; set; }
    public string? Allergies { get; set; }
    public string? MedicalHistory { get; set; }

    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }

    public User User { get; set; } = null!;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<MedicalDocument> MedicalDocuments { get; set; } = new List<MedicalDocument>();
}