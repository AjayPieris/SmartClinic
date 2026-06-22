namespace SmartClinic.API.DTOs.Chat;

public class ChatHistoryRequestDto
{
    public int PageSize { get; set; } = 50;
    public DateTime? OlderThan { get; set; }
}