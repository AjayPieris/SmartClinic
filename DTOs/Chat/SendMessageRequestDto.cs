// =============================================================================
// SendMessageRequestDto.cs — Inbound payload for POST /api/chat/send
//
// The sender's identity is NEVER taken from this body — it is always
// extracted from the authenticated JWT claims in the controller.
// Accepting a senderId from the client body would allow impersonation.
// =============================================================================

using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Chat;

public class SendMessageRequestDto
{
    // Which appointment's chat session this message belongs to.
    // Drives both the DB foreign key and the Pusher channel name.
    [Required]
    public Guid AppointmentId { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(4000)] // Matches the column constraint in AppDbContext
    public string MessageText { get; set; } = string.Empty;
}