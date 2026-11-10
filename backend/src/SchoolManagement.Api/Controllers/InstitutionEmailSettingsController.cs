using System.Net.Http.Json;
using System.Net.Mail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/administration/email-settings")]
[Authorize(Policy = AuthorizationPolicies.Administration)]
public sealed class InstitutionEmailSettingsController : ControllerBase
{
    private readonly SchoolManagementDbContext db;
    private readonly IDataProtector protector;
    private readonly IHttpClientFactory httpClientFactory;
    private readonly IConfiguration configuration;
    private readonly ILogger<InstitutionEmailSettingsController> logger;

    public InstitutionEmailSettingsController(
        SchoolManagementDbContext db,
        IDataProtectionProvider provider,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<InstitutionEmailSettingsController> logger)
    {
        this.db = db;
        protector = provider.CreateProtector("KSHS.SMIS.InstitutionEmailSettings.v1");
        this.httpClientFactory = httpClientFactory;
        this.configuration = configuration;
        this.logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var x = await db.InstitutionSettings.SingleOrDefaultAsync(s => s.IsActive, ct);
        if (x is null) return NotFound(new { message = "Save institution details before configuring email." });
        return Ok(new
        {
            x.EmailEnabled,
            x.EmailSmtpHost,
            port = x.EmailSmtpPort ?? 587,
            secureMode = x.EmailSmtpSecureMode ?? "StartTls",
            x.EmailSmtpUsername,
            fromAddress = x.EmailFromAddress ?? x.Email,
            fromName = x.EmailFromName ?? x.InstitutionName,
            passwordConfigured = !string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected)
        });
    }

    [HttpPut]
    public async Task<IActionResult> Save(SaveInstitutionEmailSettings request, CancellationToken ct)
    {
        var x = await db.InstitutionSettings.SingleOrDefaultAsync(s => s.IsActive, ct);
        if (x is null) return BadRequest(new { message = "Save institution details before configuring email." });
        if (string.IsNullOrWhiteSpace(request.Host) || request.Host.Length > 255 || request.Port is < 1 or > 65535)
            return BadRequest(new { message = "SMTP host and a valid port are required." });
        if (request.SecureMode is not ("SslOnConnect" or "StartTls" or "StartTlsWhenAvailable"))
            return BadRequest(new { message = "Choose SslOnConnect, StartTls or StartTlsWhenAvailable." });
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 255
            || !MailAddress.TryCreate(request.FromAddress, out _))
            return BadRequest(new { message = "Valid SMTP username and sender email are required." });
        if (string.IsNullOrWhiteSpace(request.FromName) || request.FromName.Length > 200)
            return BadRequest(new { message = "Sender name is required." });
        if (request.ClearPassword) x.EmailSmtpPasswordProtected = null;
        else if (!string.IsNullOrWhiteSpace(request.Password)) x.EmailSmtpPasswordProtected = protector.Protect(request.Password);
        if (!string.IsNullOrEmpty(request.Password) && request.Password.Length > 4096)
            return BadRequest(new { message = "SMTP password must not exceed 4096 characters." });
        if (request.Enabled && string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected) && string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Enter the SMTP password before enabling email." });

        x.EmailEnabled = request.Enabled;
        x.EmailSmtpHost = request.Host.Trim();
        x.EmailSmtpPort = request.Port;
        x.EmailSmtpSecureMode = request.SecureMode;
        x.EmailSmtpUsername = request.Username.Trim();
        x.EmailFromAddress = request.FromAddress.Trim();
        x.EmailFromName = request.FromName.Trim();
        x.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new
        {
            x.EmailEnabled, x.EmailSmtpHost, x.EmailSmtpPort, x.EmailSmtpSecureMode,
            x.EmailSmtpUsername, x.EmailFromAddress, x.EmailFromName,
            passwordConfigured = !string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected)
        });
    }

    [HttpPost("test")]
    public async Task<IActionResult> Test(TestInstitutionEmailRequest request, CancellationToken ct)
    {
        if (!MailAddress.TryCreate(request.Recipient, out _))
            return BadRequest(new { message = "Enter a valid recipient email." });
        var x = await db.InstitutionSettings.SingleOrDefaultAsync(s => s.IsActive, ct);
        if (x is null || !x.EmailEnabled || string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected))
            return Conflict(new { message = "Configure and enable institutional SMTP first." });

        var apiKey = configuration["EmailService:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Length < 32)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "The local institutional email service is not configured." });

        try
        {
            var payload = new
            {
                smtp = new
                {
                    host = x.EmailSmtpHost,
                    port = x.EmailSmtpPort ?? 587,
                    secureMode = x.EmailSmtpSecureMode ?? "StartTls",
                    username = x.EmailSmtpUsername,
                    password = protector.Unprotect(x.EmailSmtpPasswordProtected)
                },
                sender = new
                {
                    address = x.EmailFromAddress ?? x.Email!,
                    name = x.EmailFromName ?? x.InstitutionName
                },
                recipient = request.Recipient.Trim(),
                institutionName = x.InstitutionName
            };
            using var message = new HttpRequestMessage(HttpMethod.Post, "/internal/test");
            message.Headers.Add("x-smis-email-service-key", apiKey);
            message.Content = JsonContent.Create(payload);
            using var response = await httpClientFactory.CreateClient("InstitutionalEmailService").SendAsync(message, ct);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Institutional email service test failed. StatusCode={StatusCode}", (int)response.StatusCode);
                return StatusCode(StatusCodes.Status502BadGateway,
                    new { message = "SMTP test failed. Verify the local email service, SMTP server, port, TLS mode and credentials." });
            }
            return Ok(new { sent = true, recipient = request.Recipient.Trim() });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Institutional email service test failed.");
            return StatusCode(StatusCodes.Status502BadGateway,
                new { message = "SMTP test failed. Verify the local email service, SMTP server, port, TLS mode and credentials." });
        }
    }
}

public sealed record SaveInstitutionEmailSettings(
    bool Enabled, string Host, int Port, string SecureMode, string Username, string? Password,
    string FromAddress, string FromName, bool ClearPassword = false);
public sealed record TestInstitutionEmailRequest(string Recipient);
