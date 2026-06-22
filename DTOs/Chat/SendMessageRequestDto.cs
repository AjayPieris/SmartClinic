using System.ComponentModel.DataAnnotations;

namespace SmartClinic.API.DTOs.Chat;

public class SendMessageRequestDto
{
    [Required]
    public Guid AppointmentId { get; set; }

    [Required]
    [MinLength(1)]
    [MaxLength(4000)]
    public string MessageText { get; set; } = string.Empty;
}