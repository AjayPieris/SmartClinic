using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartClinic.API.DTOs.Documents;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim missing."));

    private string GetCurrentUserRole() =>
        User.FindFirstValue(ClaimTypes.Role)
            ?? throw new InvalidOperationException("Role claim missing.");

    [HttpPost("upload")]
    [Authorize(Roles = "Patient")]
    [RequestSizeLimit(10_485_760)]
    [ProducesResponseType(typeof(MedicalDocumentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequestDto request)
    {
        try
        {
            var result = await _documentService.UploadDocumentAsync(request, GetCurrentUserId());
            return CreatedAtAction(nameof(GetMyDocuments), new { id = result.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-documents")]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(IEnumerable<MedicalDocumentDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDocuments()
    {
        var documents = await _documentService.GetPatientDocumentsAsync(GetCurrentUserId());
        return Ok(documents);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Patient,Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        try
        {
            await _documentService.DeleteDocumentAsync(id, GetCurrentUserId(), GetCurrentUserRole());
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("profile-picture")]
    [RequestSizeLimit(5_242_880)]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadProfilePicture([FromForm] UploadProfilePictureRequestDto request)
    {
        try
        {
            var newUrl = await _documentService.UploadProfilePictureAsync(
                request.File, GetCurrentUserId());

            return Ok(new { profilePictureUrl = newUrl });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}