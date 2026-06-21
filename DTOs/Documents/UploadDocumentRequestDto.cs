

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SmartClinic.API.DTOs.Documents;

public class UploadDocumentRequestDto
{

    [Required]
    public IFormFile File { get; set; } = null!;

    // Human-readable label the patient assigns (e.g. "Blood Test - March 2025")
    [Required]
    [MaxLength(500)]
    public string DocumentName { get; set; } = string.Empty;

    // Optional: link this document to a specific appointment for context
    public Guid? AppointmentId { get; set; }
}