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
    private readonly INotificationService _notificationService;

    private const string NewMessageEvent = "new-message";

    public ChatService(AppDbContext db, IPusherService pusher, ILogger<ChatService> logger, INotificationService notificationService)
    {
        _db = db;
        _pusher = pusher;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<ChatMessageDto> SendMessageAsync(
        SendMessageRequestDto request, Guid senderUserId)
    {
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile).ThenInclude(d => d.User)
            .Include(a => a.PatientProfile).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(a => a.Id == request.AppointmentId)
            ?? throw new KeyNotFoundException($"Appointment {request.AppointmentId} not found.");

        var isDoctorParticipant  = appointment.DoctorProfile.UserId  == senderUserId;
        var isPatientParticipant = appointment.PatientProfile.UserId == senderUserId;

        if (!isDoctorParticipant && !isPatientParticipant)
            throw new UnauthorizedAccessException("You are not a participant of this appointment's chat.");

        var chatableStatuses = new[] { AppointmentStatus.Pending, AppointmentStatus.Confirmed };
        if (!chatableStatuses.Contains(appointment.Status))
            throw new InvalidOperationException($"Chat is not available for appointments with status '{appointment.Status}'.");

        var senderUser = isDoctorParticipant
            ? appointment.DoctorProfile.User
            : appointment.PatientProfile.User;

        var senderRole = isDoctorParticipant ? "Doctor" : "Patient";

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
            IsFromCurrentUser     = false,
        };

        var channelName = $"appointment-{request.AppointmentId}-chat";
        await _pusher.TriggerAsync(channelName, NewMessageEvent, messageDto);

        var recipientUserId = isDoctorParticipant ? appointment.PatientProfile.UserId : appointment.DoctorProfile.UserId;
        await _notificationService.CreateNotificationAsync(
            recipientUserId, 
            $"New message from {senderUser.FirstName}", 
            request.MessageText.Length > 50 ? request.MessageText[..47] + "..." : request.MessageText,
            "Message", 
            request.AppointmentId);

        return messageDto;
    }

    public async Task<IEnumerable<ChatMessageDto>> GetHistoryAsync(
        Guid appointmentId, Guid requestingUserId, ChatHistoryRequestDto pagination)
    {
        var appointment = await _db.Appointments
            .Include(a => a.DoctorProfile)
            .Include(a => a.PatientProfile)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == appointmentId)
            ?? throw new KeyNotFoundException("Appointment not found.");

        var isDoctorParticipant  = appointment.DoctorProfile.UserId  == requestingUserId;
        var isPatientParticipant = appointment.PatientProfile.UserId == requestingUserId;

        if (!isDoctorParticipant && !isPatientParticipant)
            throw new UnauthorizedAccessException("You are not a participant of this appointment's chat.");

        var pageSize = Math.Clamp(pagination.PageSize, 1, 100);

        var query = _db.ChatMessages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.AppointmentId == appointmentId && !m.IsDeleted);

        if (pagination.OlderThan.HasValue)
            query = query.Where(m => m.SentAtUtc < pagination.OlderThan.Value);

        var messages = await query
            .OrderByDescending(m => m.SentAtUtc)
            .Take(pageSize)
            .ToListAsync();

        messages.Reverse();

        return messages.Select(m => new ChatMessageDto
        {
            Id                      = m.Id,
            AppointmentId           = m.AppointmentId,
            SenderId                = m.SenderId,
            SenderFullName          = $"{m.Sender.FirstName} {m.Sender.LastName}",
            SenderRole              = m.SenderId == appointment.DoctorProfile.UserId
                                        ? "Doctor" : "Patient",
            SenderProfilePictureUrl = m.Sender.ProfilePictureUrl,
            MessageText             = m.MessageText,
            SentAtUtc               = m.SentAtUtc,
            IsFromCurrentUser       = false,
        });
    }
}