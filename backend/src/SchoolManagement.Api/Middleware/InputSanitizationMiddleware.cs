using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace SchoolManagement.Api.Middleware;

public sealed class InputSanitizationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InputSanitizationMiddleware> _logger;

    private static readonly Regex[] _xssPatterns =
    {
        new(@"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"javascript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"on\w+\s*=", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"data\s*:\s*text/html", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"vbscript\s*:", RegexOptions.IgnoreCase | RegexOptions.Compiled),
        new(@"expression\s*\(", RegexOptions.IgnoreCase | RegexOptions.Compiled),
    };

    public InputSanitizationMiddleware(RequestDelegate next, ILogger<InputSanitizationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Method is "POST" or "PUT" or "PATCH"
            && context.Request.ContentType?.Contains("application/json", StringComparison.OrdinalIgnoreCase) == true)
        {
            context.Request.EnableBuffering();
            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (HasXssPattern(body))
            {
                _logger.LogWarning("Potential XSS payload detected in request body. Path={Path}; CorrelationId={CorrelationId}",
                    context.Request.Path,
                    context.Items[SchoolManagement.Api.Middleware.CorrelationIdMiddleware.ItemKey] as string ?? context.TraceIdentifier);
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new { error = "Invalid input detected." });
                return;
            }
        }

        await _next(context);
    }

    private static bool HasXssPattern(string body)
    {
        foreach (var pattern in _xssPatterns)
        {
            if (pattern.IsMatch(body))
                return true;
        }
        return false;
    }
}
