using SmartClinic.API.DTOs.Chat;

namespace SmartClinic.API.Services.Interfaces;

public interface IChatService
{
    Task<ChatMessageDto> SendMessageAsync(SendMessageRequestDto request, Guid senderUserId);

    Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(
        Guid appointmentId, Guid requestingUserId, ChatHistoryRequestDto pagination);
}