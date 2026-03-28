// =============================================================================
// ChatService.cs — Orchestrates message persistence and real-time delivery.
//
// The Send flow (in order):
//   1. Load the appointment and verify the sender is a participant
//   2. Confirm the appointment is in a state that allows chat
//      (Confirmed or Pending — not Cancelled or Completed)
//   3. Persist the ChatMessage to Neon via EF Core
//   4. Trigger the Pusher event with the full ChatMessageDto as payload
//   5. Return the DTO to the HTTP caller (the sender)
//
// Steps 3 and 4 are intentionally sequential (not parallel):
//   - We must save to DB FIRST so the message exists even if Pusher fails.
//   - If we triggered Pusher before saving and the DB write failed, the
//     recipient would see a "ghost" message that doesn't exist in the DB.
// =============================================================================

using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.Data.Models;
using SmartClinic.API.DTOs.Chat;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _db;
    private readonly IPusherService _pusher;
    private readonly ILogger<ChatService> _logger;

    // Pusher event name — must exactly match what pusher-js subscribes to in React
    private const string NewMessageEvent = "new-message";

    public ChatService(AppDbContext db, IPusherService pusher, ILogger<ChatService> logger)
    {
        _db = db;
        _pusher = pusher;
        _logger = logger;
    }

    // -------------------------------------------------------------------------
    // SendMessageAsync
    // -------------------------------------------------------------------------
    public async Task<ChatMessageDto> SendMessageAsync(
        SendMessageRequestDto request, Guid senderUserId)
    {
        // ── 1. Load appointment with full participant data ───────────────────
        // We need the appointment to:
        //   a) Verify the sender is actually in this appointment
        //   b) Check the appointment status allows chat
        //   c) Build the Pusher channel name
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId)
            ?? throw new KeyNotFoundException(
                $"Appointment {request.AppointmentId} not found.");

        // ── 2. Authorization: only the doctor or patient may chat ─────────────
        var isDoctorParticipant  = appointment.DoctorProfile.UserId  == senderUserId;
        var isPatientParticipant = appointment.PatientProfile.UserId == senderUserId;

        if (!isDoctorParticipant && !isPatientParticipant)
            throw new UnauthorizedAccessException(
                "You are not a participant of this appointment's chat.");

        // ── 3. Status gate: refuse chat on cancelled/completed appointments ───
        // Allow chat on Pending (pre-confirmation) and Confirmed appointments
        var chatableStatuses = new[] { AppointmentStatus.Pending, AppointmentStatus.Confirmed };
        if (!chatableStatuses.Contains(appointment.Status))
            throw new InvalidOperationException(
                $"Chat is not available for appointments with status '{appointment.Status}'.");

        // ── 4. Load the sender's User record for the response DTO ────────────
        var senderUser = isDoctorParticipant
            ? appointment.DoctorProfile.User
            : appointment.PatientProfile.User;

        var senderRole = isDoctorParticipant ? "Doctor" : "Patient";

        // ── 5. Persist the message to Neon ────────────────────────────────────
        var chatMessage = new ChatMessage
        {
            AppointmentId = request.AppointmentId,
            SenderId      = senderUserId,
            MessageText   = request.MessageText.Trim(),
            SentAtUtc     = DateTime.UtcNow,
        };

        _db.ChatMessages.Add(chatMessage);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "ChatMessage {MsgId} saved for appointment {ApptId} from {Role} {UserId}",
            chatMessage.Id, request.AppointmentId, senderRole, senderUserId);

        // ── 6. Build the DTO that becomes the Pusher payload ─────────────────
        // IsFromCurrentUser is set to FALSE here — the Pusher broadcast goes to
        // ALL subscribers including the sender themselves. The React ChatBox sets
        // this flag CLIENT-SIDE by comparing SenderId to the logged-in user's ID.
        var messageDto = new ChatMessageDto
        {
            Id                    = chatMessage.Id,
            AppointmentId         = chatMessage.AppointmentId,
            SenderId              = senderUserId,
            SenderFullName        = $"{senderUser.FirstName} {senderUser.LastName}",
            SenderRole            = senderRole,
            SenderProfilePictureUrl = senderUser.ProfilePictureUrl,
            MessageText           = chatMessage.MessageText,
            SentAtUtc             = chatMessage.SentAtUtc,
            IsFromCurrentUser     = false, // Set by client based on their own userId
        };

        // ── 7. Trigger Pusher event ───────────────────────────────────────────
        // Channel name follows the convention: "appointment-{id}-chat"
        // BOTH the patient and the doctor subscribe to this same channel
        // so they both receive the event simultaneously.
        var channelName = $"appointment-{request.AppointmentId}-chat";
        await _pusher.TriggerAsync(channelName, NewMessageEvent, messageDto);

        // Return the DTO to the HTTP caller (the sender gets it as 201 Created)
        return messageDto;
    }

    // -------------------------------------------------------------------------
    // GetHistoryAsync — paginated message history
    // -------------------------------------------------------------------------
    public async Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(
        Guid appointmentId, Guid requestingUserId, ChatHistoryRequestDto pagination)
    {
        // Load appointment to verify participant access
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile)
            .Include(a => a.PatientProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == appointmentId)
            ?? throw new KeyNotFoundException("Appointment not found.");

        // Authorization check
        var isDoctorParticipant  = appointment.DoctorProfile.UserId  == requestingUserId;
        var isPatientParticipant = appointment.PatientProfile.UserId == requestingUserId;

        if (!isDoctorParticipant && !isPatientParticipant)
            throw new UnauthorizedAccessException(
                "You are not a participant of this appointment's chat.");

        // Clamp page size to prevent abuse (max 100 messages per request)
        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        // Build the base query — includes sender info for DTO mapping
        var query = _db.ChatMessages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.AppointmentId == appointmentId && !m.IsDeleted);

        // Cursor-based pagination: if OlderThan is set, only return older messages
        if (pagination.OlderThan.HasValue)
            query = query.Where(m => m.SentAtUtc < pagination.OlderThan.Value);

        // Fetch newest-first so we can take the top N, then reverse for display
        var messages = await query
            .OrderByDescending(m => m.SentAtUtc)
            .Take(pageSize)
            .ToListAsync();

        // Reverse so the React ChatBox receives messages oldest-first
        // (correct chronological order for rendering top-to-bottom)
        messages.Reverse();

        return messages.Select(m => new ChatMessageDto
        {
            Id                      = m.Id,
            AppointmentId           = m.AppointmentId,
            SenderId                = m.SenderId,
            SenderFullName          = $"{m.Sender.FirstName} {m.Sender.LastName}",
            // Determine role from appointment participant relationship
            SenderRole              = m.SenderId == appointment.DoctorProfile.UserId
                                        ? "Doctor" : "Patient",
            SenderProfilePictureUrl = m.Sender.ProfilePictureUrl,
            MessageText             = m.MessageText,
            SentAtUtc               = m.SentAtUtc,
            // Not relevant in history — client sets this via its own userId comparison
            IsFromCurrentUser       = false,
        });
    }
}