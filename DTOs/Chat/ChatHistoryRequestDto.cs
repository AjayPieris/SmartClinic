// =============================================================================
// ChatHistoryRequestDto.cs — Query params for GET /api/chat/{appointmentId}/history
//
// Supports cursor-based pagination so loading a long chat history does not
// return thousands of rows in a single query. The React ChatBox loads the
// latest N messages on mount, then fetches older pages as the user scrolls up.
// =============================================================================

namespace SmartClinic.API.DTOs.Chat;

public class ChatHistoryRequestDto
{
    // How many messages to return per page (default 50, max 100)
    public int PageSize { get; set; } = 50;

    // Cursor: return messages older than this UTC timestamp.
    // On first load, leave null → returns the most recent PageSize messages.
    // On scroll-up, pass the SentAtUtc of the oldest message currently shown.
    public DateTime? OlderThan { get; set; }
}