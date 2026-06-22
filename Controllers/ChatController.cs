using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartClinic.API.DTOs.Chat;
using SmartClinic.API.Services.Interfaces;
using SmartClinic.API.Data;
using Microsoft.EntityFrameworkCore;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IPusherService _pusherService;

    public ChatController(IChatService chatService, IPusherService pusherService)
    {
        _chatService = chatService;
        _pusherService = pusherService;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim missing."));

    [HttpPost("send")]
    [Authorize(Roles = "Patient,Doctor")]
    [ProducesResponseType(typeof(ChatMessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequestDto request)
    {
        try
        {
            var result = await _chatService.SendMessageAsync(request, GetCurrentUserId());
            return CreatedAtAction(nameof(SendMessage), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{appointmentId:guid}/history")]
    [Authorize(Roles = "Patient,Doctor")]
    [ProducesResponseType(typeof(IEnumerable<ChatMessageDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetChatHistory(
        Guid appointmentId,
        [FromQuery] int pageSize = 50,
        [FromQuery] DateTime? olderThan = null)
    {
        try
        {
            var pagination = new ChatHistoryRequestDto
            {
                PageSize = pageSize,
                OlderThan = olderThan,
            };

            var history = await _chatService.GetHistoryAsync(
                appointmentId, GetCurrentUserId(), pagination);

            return Ok(history);
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
}

[ApiController]
[Route("api/pusher")]
[Authorize]
public class PusherAuthController : ControllerBase
{
    private readonly IPusherService _pusherService;
    private readonly AppDbContext _db;

    public PusherAuthController(IPusherService pusherService, AppDbContext db)
    {
        _pusherService = pusherService;
        _db = db;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim missing."));

    [HttpPost("auth")]
    public async Task<IActionResult> AuthorizeChannel(
        [FromForm] string socket_id,
        [FromForm] string channel_name)
    {
        var parts = channel_name.Split('-');
        if (parts.Length < 4 || !Guid.TryParse(parts[2], out var appointmentId))
            return BadRequest(new { message = "Invalid channel name format." });

        var userId = GetCurrentUserId();
        var isParticipant = await _db.Appointments
            .AnyAsync(a =>
                a.Id == appointmentId &&
                (a.DoctorProfile.UserId == userId || a.PatientProfile.UserId == userId));

        if (!isParticipant)
            return Forbid();

        var authResponse = _pusherService.AuthenticateChannel(socket_id, channel_name);

        return Content(authResponse, "application/json");
    }
}