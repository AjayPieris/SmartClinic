using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SmartClinic.API.DTOs.Notification;

namespace SmartClinic.API.Services.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationDto> CreateNotificationAsync(Guid userId, string title, string message, string type, Guid? relatedEntityId);
        Task<List<NotificationDto>> GetUserNotificationsAsync(Guid userId, bool unreadOnly = false);
        Task MarkAsReadAsync(Guid notificationId, Guid userId);
        Task MarkAllAsReadAsync(Guid userId);
    }
}
