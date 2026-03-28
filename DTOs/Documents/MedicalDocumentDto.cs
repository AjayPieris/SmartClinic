// =============================================================================
// MedicalDocumentDto.cs — Outbound representation of a stored document.
//
// We intentionally expose CloudinaryUrl (the HTTPS CDN link) here because
// the patient and their doctor need to open/download the file.
// The CloudinaryPublicId is NEVER exposed in DTOs — it is an internal
// Cloudinary management key that should only be used server-side for deletion.
// =============================================================================

namespace SmartClinic.API.DTOs.Documents;

public class MedicalDocumentDto
{
    public Guid Id { get; set; }
    public Guid PatientProfileId { get; set; }
    public Guid? AppointmentId { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;

    // Secure HTTPS Cloudinary CDN URL — safe to expose to authorized clients
    public string CloudinaryUrl { get; set; } = string.Empty;

    // Human-readable file size (e.g. "2.4 MB") — formatted in the service layer
    public string FileSizeFormatted { get; set; } = string.Empty;

    public DateTime UploadedAtUtc { get; set; }
}