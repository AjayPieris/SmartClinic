// =============================================================================
// RejectDoctorRequestDto.cs — Payload for the reject-doctor endpoint.
// =============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Admin;

public class RejectDoctorRequestDto
{
    [MaxLength(1000)]
    public string? RejectionReason { get; set; }
}
