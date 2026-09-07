using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Communication;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/sms")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class SmsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("templates")]
    public async Task<IActionResult> GetTemplates(CancellationToken cancellationToken)
    {
        var templates = await db.Set<Notification>().AsNoTracking()
            .Where(n => n.Channel == "SMS" && !string.IsNullOrEmpty(n.TemplateName))
            .Select(n => n.TemplateName!).Distinct().ToListAsync(cancellationToken);
        return Ok(templates);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] string? recipientType, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = db.Set<Notification>().AsNoTracking().Where(n => n.Channel == "SMS");
        if (!string.IsNullOrWhiteSpace(recipientType)) query = query.Where(n => n.RecipientType == recipientType.Trim());
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(n => n.Status == status.Trim());
        var history = await query.OrderByDescending(n => n.CreatedAtUtc).Take(100)
            .Select(n => new { n.Id, n.Title, n.Body, n.RecipientType, n.RecipientId, n.Status, n.ErrorMessage, n.CreatedAtUtc, n.SentAtUtc })
            .ToListAsync(cancellationToken);
        return Ok(history);
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendSms([FromBody] SendSmsRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message)) return BadRequest(new { message = "Message is required." });
        if (request.RecipientIds is null || request.RecipientIds.Length == 0) return BadRequest(new { message = "At least one recipient is required." });

        var notifications = request.RecipientIds.Select(recipientId => new Notification
        {
            Title = request.Subject ?? "School Notification", Body = request.Message, Channel = "SMS",
            RecipientType = request.RecipientType ?? "Student", RecipientId = recipientId,
            TemplateName = request.TemplateName, Status = "Pending"
        }).ToList();
        db.Set<Notification>().AddRange(notifications);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true, message = $"SMS queued for {notifications.Count} recipients.", count = notifications.Count });
    }

    [HttpPost("send-bulk")]
    public async Task<IActionResult> SendBulkSms([FromBody] SendBulkSmsRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message)) return BadRequest(new { message = "Message is required." });
        if (string.IsNullOrWhiteSpace(request.RecipientType)) return BadRequest(new { message = "Recipient type is required." });

        IQueryable<Student> query = db.Students.AsNoTracking();
        var recipients = await query.Select(s => s.Id).ToListAsync(cancellationToken);
        if (recipients.Count == 0) return BadRequest(new { message = "No recipients found matching the criteria." });

        var notifications = recipients.Select(recipientId => new Notification
        {
            Title = request.Subject ?? "School Notification", Body = request.Message, Channel = "SMS",
            RecipientType = request.RecipientType.Trim(), RecipientId = recipientId.ToString(),
            TemplateName = request.TemplateName, Status = "Pending"
        }).ToList();
        db.Set<Notification>().AddRange(notifications);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true, message = $"SMS queued for {notifications.Count} recipients.", count = notifications.Count });
    }
}

public sealed record SendSmsRequest(string? Subject, string Message, string? RecipientType, string[] RecipientIds, string? TemplateName);
public sealed record SendBulkSmsRequest(string? Subject, string Message, string RecipientType, string? ClassFilter, string? TemplateName);
