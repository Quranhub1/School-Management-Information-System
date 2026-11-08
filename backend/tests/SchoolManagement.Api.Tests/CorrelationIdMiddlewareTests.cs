using Microsoft.AspNetCore.Http;
using SchoolManagement.Api.Middleware;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class CorrelationIdMiddlewareTests
{
    [Fact]
    public async Task PreservesSafeClientCorrelationIdAndReturnsItInHeader()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers[CorrelationIdMiddleware.HeaderName] = "finance-save-2026-01";
        var middleware = new CorrelationIdMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(context);

        Assert.Equal("finance-save-2026-01", context.Response.Headers[CorrelationIdMiddleware.HeaderName]);
        Assert.Equal("finance-save-2026-01", context.Items[CorrelationIdMiddleware.ItemKey]);
    }

    [Fact]
    public async Task ReplacesUnsafeClientCorrelationId()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers[CorrelationIdMiddleware.HeaderName] = "invalid value\r\nInjected: true";
        var middleware = new CorrelationIdMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(context);

        var correlationId = Assert.IsType<string>(context.Items[CorrelationIdMiddleware.ItemKey]);
        Assert.DoesNotContain(" ", correlationId);
        Assert.DoesNotContain("\r", correlationId);
        Assert.Equal(correlationId, context.Response.Headers[CorrelationIdMiddleware.HeaderName]);
    }

    [Fact]
    public async Task GeneratesCorrelationIdWhenClientDoesNotSupplyOne()
    {
        var context = new DefaultHttpContext();
        var middleware = new CorrelationIdMiddleware(_ => Task.CompletedTask);

        await middleware.InvokeAsync(context);

        var correlationId = Assert.IsType<string>(context.Items[CorrelationIdMiddleware.ItemKey]);
        Assert.False(string.IsNullOrWhiteSpace(correlationId));
        Assert.Equal(correlationId, context.Response.Headers[CorrelationIdMiddleware.HeaderName]);
    }
}
