

namespace SmartClinic.API.Data.Models;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // The appointment this message belongs to
    public Guid AppointmentId { get; set; }

    // The user who sent the message (Doctor or Patient)
    public Guid SenderId { get; set; }

    public string MessageText { get; set; } = string.Empty;

    // UTC timestamp — clients display in local time
    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;

    // Soft-delete for moderation purposes
    public bool IsDeleted { get; set; } = false;

    // -------------------------------------------------------------------------
    // Navigation properties
    // -------------------------------------------------------------------------
    public Appointment Appointment { get; set; } = null!;
    public User Sender { get; set; } = null!;
}