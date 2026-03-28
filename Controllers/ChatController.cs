// =============================================================================
// ChatController.cs — HTTP interface for the real-time chat feature.
//
// Endpoints:
//   POST /api/chat/send             — Send a message (triggers Pusher event)
//   GET  /api/chat/{id}/history     — Load paginated chat history
//   POST /api/pusher/auth           — Authenticate private Pusher channel (future)
//
// The /api/pusher/auth endpoint is on a SEPARATE controller prefix but
// is housed here for co-location. Move to PusherController.cs if it grows.
// =============================================================================

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartClinic.API.DTOs.Chat;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize] // All chat endpoints require a valid JWT
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IPusherService _pusherService;

    public ChatController(IChatService chatService, IPusherService pusherService)
    {
        _chatService = chatService;
        _pusherService = pusherService;
    }

    // Extract identity from JWT — never from request body
    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim missing."));

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/chat/send
    // Both Patients and Doctors can send messages (role gating is in ChatService)
    // ─────────────────────────────────────────────────────────────────────────
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

            // 201 Created — the message is now in the DB and Pusher was triggered
            return CreatedAtAction(nameof(SendMessage), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            // Sender is not a participant of this appointment
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            // Chat not allowed on this appointment status
            return BadRequest(new { message = ex.Message });
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/chat/{appointmentId}/history
    // Load paginated chat history for an appointment
    // Supports cursor-based scroll-up pagination via OlderThan query param
    // ─────────────────────────────────────────────────────────────────────────
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
                PageSize  = pageSize,
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

// =============================================================================
// PusherAuthController — Handles private channel authentication.
//
// When pusher-js tries to subscribe to "private-appointment-{id}-chat",
// it POSTs to this endpoint with socket_id and channel_name.
// We verify the user is a participant of that appointment, then return
// the Pusher auth signature so Pusher's server approves the subscription.
//
// This endpoint is REQUIRED only when using private channels.
// For the current public channel setup it is optional, but wired here
// so upgrading to private channels only requires:
//   1. Change "appointment-" to "private-appointment-" in the channel name
//   2. Uncomment the [Authorize] call in pusher-js on the React side
// =============================================================================
[ApiController]
[Route("api/pusher")]
[Authorize]
public class PusherAuthController : ControllerBase
{
    private readonly IPusherService _pusherService;
    private readonly AppDbContext _db; // Only needed for participant check

    public PusherAuthController(IPusherService pusherService, AppDbContext db)
    {
        _pusherService = pusherService;
        _db = db;
    }

    private Guid GetCurrentUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("User ID claim missing."));

    // POST /api/pusher/auth
    // Called automatically by pusher-js when subscribing to a private channel
    [HttpPost("auth")]
    public async Task<IActionResult> AuthorizeChannel(
        [FromForm] string socket_id,
        [FromForm] string channel_name)
    {
        // Extract the appointment ID from the channel name:
        // "private-appointment-{guid}-chat" → parse the guid portion
        // Channel format: private-appointment-{appointmentId}-chat
        var parts = channel_name.Split('-');
        if (parts.Length < 4 || !Guid.TryParse(parts[2], out var appointmentId))
            return BadRequest(new { message = "Invalid channel name format." });

        // Verify the requesting user is a participant of this appointment
        var userId = GetCurrentUserId();
        var isParticipant = await _db.Appointments
            .AnyAsync(a =>
                a.Id == appointmentId &&
                (a.DoctorProfile.UserId == userId || a.PatientProfile.UserId == userId));

        if (!isParticipant)
            return Forbid(); // Pusher will reject the subscription

        // Generate the Pusher auth signature
        var authResponse = _pusherService.AuthenticateChannel(socket_id, channel_name);

        // Return raw JSON — pusher-js expects exactly this format
        return Content(authResponse, "application/json");
    }
}