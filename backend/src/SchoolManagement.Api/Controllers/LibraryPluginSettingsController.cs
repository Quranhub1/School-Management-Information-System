using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration/library-plugins")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class LibraryPluginSettingsController(
    SchoolManagementDbContext db,
    IDataProtectionProvider protectionProvider,
    IHttpClientFactory httpClientFactory) : ControllerBase
{
    private readonly IDataProtector _protector = protectionProvider.CreateProtector("SMIS.LibraryPlugins.Credentials.v1");

    public sealed record SettingsDto(
        string KohaOpacUrl, string KohaApiUrl, string? KohaUsername, bool HasKohaPassword, bool KohaEnabled,
        string DSpaceBaseUrl, string DSpaceRestApiUrl, string DSpaceOaiPmhUrl, string? DSpaceUsername,
        bool HasDSpacePassword, bool DSpaceEnabled, decimal FinePerOverdueDay, DateTimeOffset? UpdatedAt);

    public sealed record UpdateSettingsRequest(
        string? KohaOpacUrl, string? KohaApiUrl, string? KohaUsername, string? KohaPassword, bool KohaEnabled,
        string? DSpaceBaseUrl, string? DSpaceRestApiUrl, string? DSpaceOaiPmhUrl, string? DSpaceUsername,
        string? DSpacePassword, bool DSpaceEnabled, decimal? FinePerOverdueDay);

    [HttpGet]
    public async Task<ActionResult<SettingsDto>> Get(CancellationToken ct)
    {
        var s = await db.Set<LibraryPluginSettings>().AsNoTracking().FirstOrDefaultAsync(ct);
        return Ok(ToDto(s));
    }

    [HttpPut]
    public async Task<ActionResult<SettingsDto>> Save(UpdateSettingsRequest request, CancellationToken ct)
    {
        if (!ValidOptionalUrl(request.KohaOpacUrl) || !ValidOptionalUrl(request.KohaApiUrl) ||
            !ValidOptionalUrl(request.DSpaceBaseUrl) || !ValidOptionalUrl(request.DSpaceRestApiUrl) ||
            !ValidOptionalUrl(request.DSpaceOaiPmhUrl))
            return BadRequest(new { message = "Enter valid absolute HTTP or HTTPS service URLs. Do not include usernames or passwords in a URL." });

        var s = await db.Set<LibraryPluginSettings>().FirstOrDefaultAsync(ct) ?? new LibraryPluginSettings();
        s.KohaOpacUrl = Clean(request.KohaOpacUrl);
        s.KohaApiUrl = Clean(request.KohaApiUrl);
        s.KohaUsername = Clean(request.KohaUsername);
        if (!string.IsNullOrWhiteSpace(request.KohaPassword)) s.KohaPasswordProtected = _protector.Protect(request.KohaPassword);
        s.KohaEnabled = request.KohaEnabled;
        s.DSpaceBaseUrl = Clean(request.DSpaceBaseUrl);
        s.DSpaceRestApiUrl = Clean(request.DSpaceRestApiUrl);
        s.DSpaceOaiPmhUrl = Clean(request.DSpaceOaiPmhUrl);
        s.DSpaceUsername = Clean(request.DSpaceUsername);
        if (!string.IsNullOrWhiteSpace(request.DSpacePassword)) s.DSpacePasswordProtected = _protector.Protect(request.DSpacePassword);
        s.DSpaceEnabled = request.DSpaceEnabled;
        if (request.FinePerOverdueDay.HasValue)
        {
            if (request.FinePerOverdueDay.Value < 0) return BadRequest(new { message = "Fine per overdue day cannot be negative." });
            s.FinePerOverdueDay = request.FinePerOverdueDay.Value;
        }
        s.UpdatedAt = DateTimeOffset.UtcNow;
        if (db.Entry(s).State == EntityState.Detached) db.Add(s);
        await db.SaveChangesAsync(ct);
        return Ok(ToDto(s));
    }

    [HttpPost("test/{service}")]
    public async Task<IActionResult> Test(string service, CancellationToken ct)
    {
        var s = await db.Set<LibraryPluginSettings>().AsNoTracking().FirstOrDefaultAsync(ct);
        if (s is null) return BadRequest(new { ok = false, message = "Save the service address before testing the connection." });
        var isKoha = service.Equals("koha", StringComparison.OrdinalIgnoreCase);
        if (!isKoha && !service.Equals("dspace", StringComparison.OrdinalIgnoreCase))
            return NotFound(new { ok = false, message = "Unknown plugin. Use koha or dspace." });

        var endpoint = isKoha ? s.KohaApiUrl : s.DSpaceOaiPmhUrl;
        if (string.IsNullOrWhiteSpace(endpoint)) endpoint = isKoha ? s.KohaOpacUrl : s.DSpaceBaseUrl;
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || !IsHttp(uri))
            return BadRequest(new { ok = false, message = "A valid service endpoint has not been configured." });

        try
        {
            var client = httpClientFactory.CreateClient("LibraryPlugins");
            using var request = new HttpRequestMessage(HttpMethod.Get, isKoha ? EnsureApiRoot(uri) : EnsureOaiIdentify(uri));
            var username = isKoha ? s.KohaUsername : s.DSpaceUsername;
            var protectedPassword = isKoha ? s.KohaPasswordProtected : s.DSpacePasswordProtected;
            if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(protectedPassword))
            {
                var password = _protector.Unprotect(protectedPassword);
                request.Headers.Authorization = new AuthenticationHeaderValue("Basic",
                    Convert.ToBase64String(Encoding.UTF8.GetBytes($"{username}:{password}")));
            }
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            if (isKoha)
            {
                var ok = response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Unauthorized;
                return StatusCode(ok ? 200 : 502, new { ok, message = ok
                    ? response.StatusCode == HttpStatusCode.Unauthorized ? "Koha API is reachable; it requires valid API credentials." : $"Koha API responded with HTTP {(int)response.StatusCode}."
                    : $"Koha API returned HTTP {(int)response.StatusCode}." });
            }
            if (!response.IsSuccessStatusCode)
                return StatusCode(502, new { ok = false, message = $"DSpace OAI-PMH endpoint returned HTTP {(int)response.StatusCode}." });
            var xml = await response.Content.ReadAsStringAsync(ct);
            var document = XDocument.Parse(xml);
            var identified = document.Descendants().Any(x => x.Name.LocalName == "Identify");
            return Ok(new { ok = identified, message = identified ? "DSpace OAI-PMH Identify succeeded." : "The endpoint responded, but did not return an OAI-PMH Identify response." });
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            return StatusCode(504, new { ok = false, message = "The connection timed out. Check the host, port and firewall." });
        }
        catch (Exception ex) when (ex is HttpRequestException or UriFormatException or System.Xml.XmlException or System.Security.Cryptography.CryptographicException)
        {
            return StatusCode(502, new { ok = false, message = $"Connection test failed: {ex.Message}" });
        }
    }

    private SettingsDto ToDto(LibraryPluginSettings? s) => new(
        s?.KohaOpacUrl ?? "", s?.KohaApiUrl ?? "", s?.KohaUsername, !string.IsNullOrEmpty(s?.KohaPasswordProtected), s?.KohaEnabled ?? false,
        s?.DSpaceBaseUrl ?? "", s?.DSpaceRestApiUrl ?? "", s?.DSpaceOaiPmhUrl ?? "", s?.DSpaceUsername,
        !string.IsNullOrEmpty(s?.DSpacePasswordProtected), s?.DSpaceEnabled ?? false, s?.FinePerOverdueDay ?? 1000m, s?.UpdatedAt);

    private static string Clean(string? value) => value?.Trim() ?? "";
    private static bool IsHttp(Uri uri) => (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps) && string.IsNullOrEmpty(uri.UserInfo);
    private static bool ValidOptionalUrl(string? value) => string.IsNullOrWhiteSpace(value) ||
        (Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri) && IsHttp(uri));
    private static Uri EnsureApiRoot(Uri uri)
    {
        var builder = new UriBuilder(uri);
        var path = builder.Path.TrimEnd('/');
        if (!path.EndsWith("/api/v1", StringComparison.OrdinalIgnoreCase)) path += "/api/v1";
        builder.Path = path + "/";
        return builder.Uri;
    }
    private static Uri EnsureOaiIdentify(Uri uri)
    {
        var builder = new UriBuilder(uri);
        if (!builder.Path.Contains("oai/request", StringComparison.OrdinalIgnoreCase)) builder.Path = builder.Path.TrimEnd('/') + "/server/oai/request";
        builder.Query = "verb=Identify";
        return builder.Uri;
    }
}
