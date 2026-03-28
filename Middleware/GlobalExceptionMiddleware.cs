// =============================================================================
// Middleware/GlobalExceptionMiddleware.cs
//
// Catches any unhandled exception that bubbles up past the service layer.
// Without this, ASP.NET returns a raw 500 with stack traces in development
// and an empty response in production — both are bad UX.
//
// This middleware:
//   - Logs the full exception server-side (never exposed to the client)
//   - Returns a consistent JSON error envelope to the client
//   - Maps specific exception types to appropriate HTTP status codes
// =============================================================================

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
            // Pass the request down the pipeline
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log full exception details server-side
            _logger.LogError(ex, "Unhandled exception for {Method} {Path}",
                context.Request.Method, context.Request.Path);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        // Map exception types to HTTP status codes
        var statusCode = ex switch
        {
            KeyNotFoundException       => HttpStatusCode.NotFound,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            InvalidOperationException  => HttpStatusCode.BadRequest,
            _                          => HttpStatusCode.InternalServerError,
        };

        // Generic message for 500s — never leak internal details
        var message = statusCode == HttpStatusCode.InternalServerError
            ? "An unexpected error occurred. Please try again later."
            : ex.Message;

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var response = new { message, statusCode = (int)statusCode };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}