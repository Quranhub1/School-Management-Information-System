using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MimeKit;
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
    private readonly ILogger<InstitutionEmailSettingsController> logger;

    public InstitutionEmailSettingsController(SchoolManagementDbContext db, IDataProtectionProvider provider, ILogger<InstitutionEmailSettingsController> logger)
    {
        this.db = db;
        protector = provider.CreateProtector("KSHS.SMIS.InstitutionEmailSettings.v1");
        this.logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var x = await db.InstitutionSettings.SingleOrDefaultAsync(s => s.IsActive, ct);
        if (x is null) return NotFound(new { message = "Save institution details before configuring email." });
        return Ok(new { x.EmailEnabled, x.EmailSmtpHost, port = x.EmailSmtpPort ?? 587, secureMode = x.EmailSmtpSecureMode ?? "StartTls", x.EmailSmtpUsername, fromAddress = x.EmailFromAddress ?? x.Email, fromName = x.EmailFromName ?? x.InstitutionName, passwordConfigured = !string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected) });
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
        if (string.IsNullOrWhiteSpace(request.Username) || request.Username.Length > 255 || !MailboxAddress.TryParse(request.FromAddress, out _))
            return BadRequest(new { message = "Valid SMTP username and sender email are required." });
        if (string.IsNullOrWhiteSpace(request.FromName) || request.FromName.Length > 200)
            return BadRequest(new { message = "Sender name is required." });
        if (request.ClearPassword) x.EmailSmtpPasswordProtected = null;
        else if (!string.IsNullOrWhiteSpace(request.Password)) x.EmailSmtpPasswordProtected = protector.Protect(request.Password);
        if (request.Enabled && string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected))
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
        return Ok(new { x.EmailEnabled, x.EmailSmtpHost, x.EmailSmtpPort, x.EmailSmtpSecureMode, x.EmailSmtpUsername, x.EmailFromAddress, x.EmailFromName, passwordConfigured = !string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected) });
    }

    [HttpPost("test")]
    public async Task<IActionResult> Test(TestInstitutionEmailRequest request, CancellationToken ct)
    {
        if (!MailboxAddress.TryParse(request.Recipient, out var recipient)) return BadRequest(new { message = "Enter a valid recipient email." });
        var x = await db.InstitutionSettings.SingleOrDefaultAsync(s => s.IsActive, ct);
        if (x is null || !x.EmailEnabled || string.IsNullOrWhiteSpace(x.EmailSmtpPasswordProtected))
            return Conflict(new { message = "Configure and enable institutional SMTP first." });
        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(x.EmailFromName ?? x.InstitutionName, x.EmailFromAddress ?? x.Email));
            message.To.Add(recipient);
            message.Subject = $"{x.InstitutionName} — email configuration test";
            message.Body = new TextPart("plain") { Text = $"This is a test message from {x.InstitutionName}. Institutional email is configured." };
            using var smtp = new SmtpClient();
            var mode = x.EmailSmtpSecureMode switch { "SslOnConnect" => SecureSocketOptions.SslOnConnect, "StartTlsWhenAvailable" => SecureSocketOptions.StartTlsWhenAvailable, _ => SecureSocketOptions.StartTls };
            await smtp.ConnectAsync(x.EmailSmtpHost, x.EmailSmtpPort ?? 587, mode, ct);
            await smtp.AuthenticateAsync(x.EmailSmtpUsername, protector.Unprotect(x.EmailSmtpPasswordProtected), ct);
            await smtp.SendAsync(message, ct);
            await smtp.DisconnectAsync(true, ct);
            return Ok(new { sent = true, recipient = recipient.Address });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Institutional SMTP test failed for host {Host}", x.EmailSmtpHost);
            return StatusCode(StatusCodes.Status502BadGateway, new { message = "SMTP test failed. Verify server, port, TLS mode and credentials." });
        }
    }
}

public sealed record SaveInstitutionEmailSettings(bool Enabled, string Host, int Port, string SecureMode, string Username, string? Password, string FromAddress, string FromName, bool ClearPassword = false);
public sealed record TestInstitutionEmailRequest(string Recipient);
