// =============================================================================
// IChatService.cs — Business logic contract for the chat feature.
// =============================================================================

using SmartClinic.API.DTOs.Chat;

namespace SmartClinic.API.Services.Interfaces;

public interface IChatService
{
    /// <summary>
    /// Validates the sender is a participant of the appointment, saves the
    /// ChatMessage to the database, then triggers the Pusher event.
    /// Returns the persisted message as a DTO.
    /// </summary>
    Task<ChatMessageDto> SendMessageAsync(SendMessageRequestDto request, Guid senderUserId);

    /// <summary>
    /// Returns paginated chat history for an appointment.
    /// The requesting user must be either the doctor or patient of the appointment.
    /// </summary>
    Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(
        Guid appointmentId, Guid requestingUserId, ChatHistoryRequestDto pagination);
}