// DTOs/Auth/LoginRequestDto.cs
namespace SmartClinic.API.DTOs.Auth;

using System.ComponentModel.DataAnnotations;

public class LoginRequestDto
{
    [Required] [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}