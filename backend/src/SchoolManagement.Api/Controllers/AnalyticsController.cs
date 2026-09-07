using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize(Policy = AuthorizationPolicies.ReportingManagement)]
public sealed class AnalyticsController(IConfiguration configuration, IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        var enabled = configuration.GetValue("Superset:Enabled", false);
        var domain = configuration["Superset:PublicUrl"];
        var dashboardId = configuration["Superset:DashboardId"];

        if (!enabled || string.IsNullOrWhiteSpace(domain) || string.IsNullOrWhiteSpace(dashboardId))
            return Ok(new { enabled = false });

        return Ok(new
        {
            enabled = true,
            supersetDomain = domain.TrimEnd('/'),
            dashboardId
        });
    }

    [HttpPost("guest-token")]
    public async Task<IActionResult> GetGuestToken(CancellationToken cancellationToken)
    {
        if (!configuration.GetValue("Superset:Enabled", false))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { message = "Superset analytics is not enabled." });

        var baseUrl = configuration["Superset:InternalUrl"]?.TrimEnd('/');
        var username = configuration["Superset:Username"];
        var password = configuration["Superset:Password"];
        var dashboardId = configuration["Superset:DashboardId"];

        if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(dashboardId))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Superset integration is not fully configured on the server." });
        }

        var client = httpClientFactory.CreateClient("Superset");

        using var loginResponse = await client.PostAsJsonAsync(
            $"{baseUrl}/api/v1/security/login",
            new { username, password, provider = "db", refresh = false },
            cancellationToken);

        if (!loginResponse.IsSuccessStatusCode)
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Superset authentication failed." });

        var loginJson = await loginResponse.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
        if (!loginJson.TryGetProperty("access_token", out var accessTokenElement))
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Superset did not return an access token." });

        var accessToken = accessTokenElement.GetString();
        if (string.IsNullOrWhiteSpace(accessToken))
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Superset returned an empty access token." });

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/v1/security/guest_token/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = JsonContent.Create(new
        {
            user = new
            {
                username = User.Identity?.Name ?? "smis-user",
                first_name = User.Identity?.Name ?? "SMIS",
                last_name = "User"
            },
            resources = new[] { new { type = "dashboard", id = dashboardId } },
            rls = Array.Empty<object>()
        });

        using var guestResponse = await client.SendAsync(request, cancellationToken);
        if (!guestResponse.IsSuccessStatusCode)
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Superset guest token generation failed." });

        var guestJson = await guestResponse.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
        if (!guestJson.TryGetProperty("token", out var tokenElement))
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "Superset did not return a guest token." });

        return Ok(new { token = tokenElement.GetString() });
    }
}
