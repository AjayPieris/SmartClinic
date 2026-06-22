using System.Net;
using System.Text.Json;

namespace SmartClinic.API.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var statusCode = ex switch
        {
            KeyNotFoundException       => HttpStatusCode.NotFound,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            InvalidOperationException  => HttpStatusCode.BadRequest,
            _                          => HttpStatusCode.InternalServerError,
        };

        var message = statusCode == HttpStatusCode.InternalServerError
            ? "An unexpected error occurred. Please try again later."
            : ex.Message;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new { message, statusCode = (int)statusCode };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}