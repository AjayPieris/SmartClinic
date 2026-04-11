using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SmartClinic.API.Data;
using SmartClinic.API.DTOs.Notification;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IPusherService _pusherService;

        public NotificationService(AppDbContext context, IPusherService pusherService)
        {
            _context = context;
            _pusherService = pusherService;
        }

        public async Task<NotificationDto> CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedEntityId)
        {
            var notification = new Data.Models.Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                RelatedEntityId = relatedEntityId,
                IsRead = false,
                CreatedAtUtc = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            var dto = MapToDto(notification);

            // Fire Pusher event to the user's private notification channel
            var channelName = $"private-user-{userId}-notifications";
            await _pusherService.TriggerAsync(channelName, "new-notification", dto);

            return dto;
        }

        public async Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false)
        {
            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (unreadOnly)
            {
                query = query.Where(n => !n.IsRead);
            }

            var notifications = await query
                .OrderByDescending(n => n.CreatedAtUtc)
                .ToListAsync();

            return notifications.Select(MapToDto).ToList();
        }

        public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (unreadNotifications.Any())
            {
                foreach (var note in unreadNotifications)
                {
                    note.IsRead = true;
                }
                await _context.SaveChangesAsync();
            }
        }

        private static NotificationDto MapToDto(Data.Models.Notification notification)
        {
            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                RelatedEntityId = notification.RelatedEntityId,
                IsRead = notification.IsRead,
                CreatedAtUtc = notification.CreatedAtUtc
            };
        }
    }
}
