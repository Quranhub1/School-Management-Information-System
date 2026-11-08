using System.Diagnostics;
using System.Text.RegularExpressions;
using Serilog.Context;

namespace SchoolManagement.Api.Middleware;

/// <summary>
/// Assigns a safe correlation identifier to every request and places it in the
/// response header and Serilog log context.
/// </summary>
public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-Correlation-ID";
    public const string ItemKey = "SMIS.CorrelationId";
    private static readonly Regex SafeCorrelationId = new(
        @"\A[A-Za-z0-9._-]{1,64}\z",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public async Task InvokeAsync(HttpContext context)
    {
        var suppliedId = context.Request.Headers[HeaderName].FirstOrDefault();
        var fallbackId = Activity.Current?.TraceId.ToString();
        if (string.IsNullOrWhiteSpace(fallbackId))
            fallbackId = string.IsNullOrWhiteSpace(context.TraceIdentifier)
                ? Guid.NewGuid().ToString("N")
                : context.TraceIdentifier;

        var correlationId = !string.IsNullOrWhiteSpace(suppliedId)
            && SafeCorrelationId.IsMatch(suppliedId)
                ? suppliedId
                : fallbackId;

        context.Items[ItemKey] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(context);
        }
    }
}
