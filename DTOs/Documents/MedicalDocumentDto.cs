

namespace SmartClinic.API.DTOs.Documents;

public class MedicalDocumentDto
{
    public Guid Id { get; set; }
    public Guid PatientProfileId { get; set; }
    public Guid? AppointmentId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;

    public string CloudinaryUrl { get; set; } = string.Empty;

    public string FileSizeFormatted { get; set; } = string.Empty;

    public DateTime UploadedAtUtc { get; set; }
}