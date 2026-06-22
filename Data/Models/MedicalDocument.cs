

namespace SmartClinic.API.Data.Models;

public class MedicalDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid PatientProfileId { get; set; }
    public Guid? AppointmentId { get; set; }

    public string DocumentName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string CloudinaryUrl { get; set; } = string.Empty;
    public string CloudinaryPublicId { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;

    public PatientProfile PatientProfile { get; set; } = null!;
}