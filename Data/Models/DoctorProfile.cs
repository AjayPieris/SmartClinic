namespace SmartClinic.API.Data.Models;

public class DoctorProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public string Specialization { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public string? Bio { get; set; }

    public int ConsultationDurationMinutes { get; set; } = 30;

    public string AvailabilityJson { get; set; } = "[]";

    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;
    public string? VerificationDocumentUrl { get; set; }
    public string? RejectionReason { get; set; }
    public DateTime? VerifiedAtUtc { get; set; }

    public bool IsVerified => VerificationStatus == VerificationStatus.Approved;

    public User User { get; set; } = null!;

    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}