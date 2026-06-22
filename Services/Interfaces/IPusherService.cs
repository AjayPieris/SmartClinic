namespace SmartClinic.API.Services.Interfaces;

public interface IPusherService
{
    Task TriggerAsync(string channelName, string eventName, object data);

    string AuthenticateChannel(string socketId, string channelName);
}