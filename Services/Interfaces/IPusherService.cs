// =============================================================================
// IPusherService.cs — Contract for all Pusher server-side operations.
//
// Abstracted behind an interface for the same reasons as ICloudinaryService:
//   - Controllers and ChatService never import PusherServer directly
//   - Mockable for unit tests
//   - Swappable if we migrate to a different WebSocket provider (e.g. Ably)
// =============================================================================

namespace SmartClinic.API.Services.Interfaces;

public interface IPusherService
{
    /// <summary>
    /// Triggers a Pusher event on a specific channel.
    /// In this system the channel is always "appointment-{appointmentId}-chat"
    /// and the event name is always "new-message".
    /// </summary>
    /// <param name="channelName">The Pusher channel to publish on.</param>
    /// <param name="eventName">The event name subscribers listen for.</param>
    /// <param name="data">The payload — will be JSON-serialized by the Pusher SDK.</param>
    Task TriggerAsync(string channelName, string eventName, object data);

    /// <summary>
    /// Authenticates a Pusher private channel subscription request.
    /// Required if we upgrade to private channels (recommended for production).
    /// Called from a dedicated /api/pusher/auth endpoint.
    /// </summary>
    string AuthenticateChannel(string socketId, string channelName);
}