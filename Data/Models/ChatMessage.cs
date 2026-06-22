

namespace SmartClinic.API.Data.Models;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AppointmentId { get; set; }
    public Guid SenderId { get; set; }

    public string MessageText { get; set; } = string.Empty;

    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;

    public Appointment Appointment { get; set; } = null!;
    public User Sender { get; set; } = null!;
}