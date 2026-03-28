// =============================================================================
// UploadDocumentRequestDto.cs — Inbound multipart/form-data payload.
//
// NOTE: This is NOT a standard [FromBody] JSON DTO.
// It is bound from multipart/form-data using [FromForm] in the controller.
// The IFormFile property receives the binary file stream from the HTTP request.
//
// Why IFormFile instead of base64?
//   IFormFile streams the file directly — it never fully loads into memory.
//   Base64 encoding inflates file size by ~33% and requires the entire
//   payload to be buffered before processing. For medical documents that
//   could be large PDFs, streaming is the correct approach.
// =============================================================================

using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SmartClinic.API.DTOs.Documents;

public class UploadDocumentRequestDto
{
    // The actual file binary — received as a stream from the multipart body
    [Required]
    public IFormFile File { get; set; } = null!;

    // Human-readable label the patient assigns (e.g. "Blood Test - March 2025")
    [Required]
    [MaxLength(500)]
    public string DocumentName { get; set; } = string.Empty;

    // Optional: link this document to a specific appointment for context
    public Guid? AppointmentId { get; set; }
}