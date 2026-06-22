namespace SmartClinic.API.DTOs.Chat;

public class ChatMessageDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid SenderId { get; set; }
    public string SenderFullName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string? SenderProfilePictureUrl { get; set; }
    public string MessageText { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; }
    public bool IsFromCurrentUser { get; set; }
}