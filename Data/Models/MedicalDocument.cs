

namespace SmartClinic.API.Data.Models;

public class MedicalDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Owner of the document
    public Guid PatientProfileId { get; set; }

    // The appointment this document is linked to (optional)
    public Guid? AppointmentId { get; set; }

    // Human-readable name (e.g. "Blood Test Results - Jan 2025")
    public string DocumentName { get; set; } = string.Empty;

    // MIME type — used to render preview icons in the UI
    // e.g. "application/pdf", "image/jpeg"
    public string ContentType { get; set; } = string.Empty;

    // Cloudinary secure_url — HTTPS CDN link to the file
    public string CloudinaryUrl { get; set; } = string.Empty;

    // Cloudinary public_id — needed to delete the file from Cloudinary later
    public string CloudinaryPublicId { get; set; } = string.Empty;

    // File size in bytes — displayed in the UI
    public long FileSizeBytes { get; set; }

    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;

    // -------------------------------------------------------------------------
    // Navigation properties
    // -------------------------------------------------------------------------
    public PatientProfile PatientProfile { get; set; } = null!;
}