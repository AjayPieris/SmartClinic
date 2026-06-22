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

        var appId   = config["Pusher:AppId"]   ?? throw new InvalidOperationException("Pusher:AppId missing.");
        var key     = config["Pusher:Key"]     ?? throw new InvalidOperationException("Pusher:Key missing.");
        var secret  = config["Pusher:Secret"]  ?? throw new InvalidOperationException("Pusher:Secret missing.");
        var cluster = config["Pusher:Cluster"] ?? throw new InvalidOperationException("Pusher:Cluster missing.");

        _pusher = new Pusher(appId, key, secret, new PusherOptions
        {
            Cluster = cluster,
            Encrypted = true,
        });
    }

    public async Task TriggerAsync(string channelName, string eventName, object data)
    {
        try
        {
            var result = await _pusher.TriggerAsync(channelName, eventName, data);

            _logger.LogInformation(
                "Pusher event triggered: channel={Channel}, event={Event}",
                channelName, eventName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Pusher trigger failed for channel={Channel}, event={Event}. " +
                "Message was saved to DB — real-time delivery degraded.",
                channelName, eventName);
        }
    }

    public string AuthenticateChannel(string socketId, string channelName)
    {
        var auth = _pusher.Authenticate(channelName, socketId);
        return auth.ToJson();
    }
}