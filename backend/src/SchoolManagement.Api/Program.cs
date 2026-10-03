namespace SchoolManagement.Api.Helpers;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

public static class ApiExceptionHandler
{
    public static void UseApiExceptionHandling(this WebApplication app)
    {
        app.UseExceptionHandler(exceptionHandlerApp =>
        {
            exceptionHandlerApp.Run(async context =>
            {
                var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
                var traceId = context.TraceIdentifier;
                var statusCode = context.Response.StatusCode;

                if (exception is not null)
                {
                    statusCode = exception switch
                    {
                        ArgumentException or InvalidOperationException => StatusCodes.Status400BadRequest,
                        KeyNotFoundException => StatusCodes.Status404NotFound,
                        UnauthorizedAccessException => StatusCodes.Status403Forbidden,
                        _ => StatusCodes.Status500InternalServerError,
                    };
                }
                else if (statusCode == 0 || statusCode == StatusCodes.Status200OK)
                {
                    statusCode = StatusCodes.Status500InternalServerError;
                }

                context.Response.StatusCode = statusCode;
                context.Response.ContentType = "application/problem+json";

                var logger = context.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("SchoolManagement.Api.ExceptionHandler");

                logger.LogError(exception, "Unhandled API exception. Method: {Method} Path: {Path} TraceId: {TraceId}",
                    context.Request.Method,
                    context.Request.Path,
                    traceId);

                var problem = new ProblemDetails
                {
                    Status = statusCode,
                    Title = statusCode switch
                    {
                        StatusCodes.Status400BadRequest => "Invalid request",
                        StatusCodes.Status401Unauthorized => "Authentication required",
                        StatusCodes.Status403Forbidden => "Access denied",
                        StatusCodes.Status404NotFound => "Resource not found",
                        _ => "Unexpected server error",
                    },
                    Detail = exception?.Message ?? "An unexpected error occurred while processing your request.",
                    Instance = context.Request.Path,
                    Type = $"https://httpstatuses.com/{statusCode}"
                };

                problem.Extensions["traceId"] = traceId;

                await context.Response.WriteAsJsonAsync(problem);
            });
        });

        app.UseStatusCodePages(async statusCodeContext =>
        {
            var context = statusCodeContext.HttpContext;
            var statusCode = context.Response.StatusCode;

            if (statusCode == StatusCodes.Status404NotFound)
            {
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Resource not found",
                    Detail = $"The endpoint '{context.Request.Path}' does not exist.",
                    Instance = context.Request.Path,
                    Type = "https://httpstatuses.com/404",
                    Extensions = { ["traceId"] = context.TraceIdentifier }
                });
                return;
            }

            if (statusCode == StatusCodes.Status401Unauthorized)
            {
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status401Unauthorized,
                    Title = "Authentication required",
                    Detail = "Your session is missing or invalid. Please sign in again.",
                    Instance = context.Request.Path,
                    Type = "https://httpstatuses.com/401",
                    Extensions = { ["traceId"] = context.TraceIdentifier }
                });
                return;
            }

            if (statusCode == StatusCodes.Status403Forbidden)
            {
                context.Response.ContentType = "application/problem+json";
                await context.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status403Forbidden,
                    Title = "Access denied",
                    Detail = "You do not have permission to access this resource.",
                    Instance = context.Request.Path,
                    Type = "https://httpstatuses.com/403",
                    Extensions = { ["traceId"] = context.TraceIdentifier }
                });
            }
        });
    }
}
