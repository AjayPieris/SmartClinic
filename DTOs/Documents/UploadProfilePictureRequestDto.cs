
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SmartClinic.API.DTOs.Documents;

public class UploadProfilePictureRequestDto
{
    [Required]
    public IFormFile File { get; set; } = null!;
}