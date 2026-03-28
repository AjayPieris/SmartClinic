// =============================================================================
// PusherService.cs — The ONLY file in the project that imports PusherServer.
//
// Channel naming convention used throughout this system:
//   "appointment-{appointmentId}-chat"
//
// Why this naming?
//   - Scoped per appointment: Doctor and Patient in appointment X cannot
//     accidentally receive messages from appointment Y.
//   - Works directly with Pusher's channel filtering on the client side.
//   - Predictable: both server and client derive the channel name the same way.
//
// Public vs Private channels:
//   Currently using public channels for simplicity (no server auth step needed
//   on the client). For production, upgrade to private channels ("private-..."
//   prefix) so Pusher verifies the subscription via your /api/pusher/auth
//   endpoint before allowing the client to listen. The AuthenticateChannel
//   method below is already wired for that upgrade path.
// =============================================================================

using PusherServer;
using SmartClinic.API.Services.Interfaces;

namespace SmartClinic.API.Services;

public class PusherService : IPusherService
{
    private readonly Pusher _pusher;
    private readonly ILogger<PusherService> _logger;

    public PusherService(IConfiguration config, ILogger<PusherService> logger)
    {
        _logger = logger;

        // All four Pusher credentials come from appsettings.json / environment
        var appId   = config["Pusher:AppId"]   ?? throw new InvalidOperationException("Pusher:AppId missing.");
        var key     = config["Pusher:Key"]     ?? throw new InvalidOperationException("Pusher:Key missing.");
        var secret  = config["Pusher:Secret"]  ?? throw new InvalidOperationException("Pusher:Secret missing.");
        var cluster = config["Pusher:Cluster"] ?? throw new InvalidOperationException("Pusher:Cluster missing.");

        _pusher = new Pusher(appId, key, secret, new PusherOptions
        {
            Cluster = cluster,
            Encrypted = true, // Always use TLS — never send medical chat in plaintext
        });
    }

    // -------------------------------------------------------------------------
    // TriggerAsync — publish an event to a Pusher channel
    // -------------------------------------------------------------------------
    public async Task TriggerAsync(string channelName, string eventName, object data)
    {
        try
        {
            // The Pusher SDK serializes `data` to JSON automatically.
            // The payload size limit on Pusher's free tier is 10 KB per event —
            // our ChatMessageDto is well under that.
            var result = await _pusher.TriggerAsync(channelName, eventName, data);

            _logger.LogInformation(
                "Pusher event triggered: channel={Channel}, event={Event}",
                channelName, eventName);
        }
        catch (Exception ex)
        {
            // Log the error but do NOT re-throw.
            // If Pusher is temporarily unavailable, the message is still
            // persisted in the DB. The recipient will see it when they
            // reload the chat history. Real-time delivery degrades gracefully
            // to near-real-time polling rather than causing a 500 response.
            _logger.LogError(ex,
                "Pusher trigger failed for channel={Channel}, event={Event}. " +
                "Message was saved to DB — real-time delivery degraded.",
                channelName, eventName);
        }
    }

    // -------------------------------------------------------------------------
    // AuthenticateChannel — for upgrading to private channels later
    // -------------------------------------------------------------------------
    public string AuthenticateChannel(string socketId, string channelName)
    {
        // The Pusher SDK generates an HMAC-SHA256 auth signature.
        // This signature proves to Pusher's server that OUR server approved
        // this specific socket connecting to this specific channel.
        var auth = _pusher.Authenticate(channelName, socketId);

        // auth.ToJson() returns: { "auth": "appKey:signature" }
        return auth.ToJson();
    }
}