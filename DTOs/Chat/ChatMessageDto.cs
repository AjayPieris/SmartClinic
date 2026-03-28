// =============================================================================
// ChatMessageDto.cs — Outbound shape for a single chat message.
//
// This DTO is used in TWO places:
//   1. The HTTP 201 response body from POST /api/chat/send
//      (the sender gets immediate confirmation their message was saved)
//   2. The Pusher event payload serialized to JSON and broadcast to
//      ALL subscribers on the appointment channel — including the other party.
//
// Because this DTO is broadcast over Pusher (a public-ish channel), we
// deliberately exclude any sensitive fields (e.g. internal IDs, raw DB keys).
// =============================================================================

namespace SmartClinic.API.DTOs.Chat;

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }

    // Sender info — flattened so the React ChatBox can render without extra fetches
    public Guid SenderId { get; set; }
    public string SenderFullName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty; // "Patient" | "Doctor"
    public string? SenderProfilePictureUrl { get; set; }

    public string MessageText { get; set; } = string.Empty;

    // UTC timestamp — React formats this to local time via Intl.DateTimeFormat
    public DateTime SentAtUtc { get; set; }

    // Convenience flag — React uses this to decide whether to render the
    // message bubble on the left (incoming) or right (outgoing) side
    public bool IsFromCurrentUser { get; set; }
}