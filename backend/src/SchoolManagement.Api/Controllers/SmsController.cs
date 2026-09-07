using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Communication;
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
        var templates = await db.Notifications.AsNoTracking()
            .Where(n => n.Channel == "SMS" && !string.IsNullOrEmpty(n.TemplateName))
            .Select(n => n.TemplateName)
            .Distinct()
            .ToListAsync(cancellationToken);

        return Ok(templates);
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] string? recipientType, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = db.Notifications.AsNoTracking().Where(n => n.Channel == "SMS").AsQueryable();

        if (!string.IsNullOrWhiteSpace(recipientType))
            query = query.Where(n => n.RecipientType == recipientType);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(n => n.Status == status);

        var history = await query
            .OrderByDescending(n => n.CreatedAtUtc)
            .Take(100)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Body,
                n.RecipientType,
                n.RecipientId,
                n.Status,
                n.ErrorMessage,
                n.CreatedAtUtc,
                n.SentAtUtc
            })
            .ToListAsync(cancellationToken);

        return Ok(history);
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendSms([FromBody] SendSmsRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Message is required." });

        if (request.RecipientIds == null || !request.RecipientIds.Any())
            return BadRequest(new { message = "At least one recipient is required." });

        var notifications = new List<Notification>();

        foreach (var recipientId in request.RecipientIds)
        {
            var notification = new Notification
            {
                Title = request.Subject ?? "School Notification",
                Body = request.Message,
                Channel = "SMS",
                RecipientType = request.RecipientType ?? "Student",
                RecipientId = recipientId,
                TemplateName = request.TemplateName,
                Status = "Pending",
                CreatedAtUtc = DateTime.UtcNow
            };

            db.Notifications.Add(notification);
            notifications.Add(notification);
        }

        await db.SaveChangesAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await SimulateSmsSendAsync(notification, cancellationToken);
                }
                catch
                {
                    notification.Status = "Failed";
                    notification.ErrorMessage = "SMS provider not configured.";
                    await db.SaveChangesAsync(cancellationToken);
                }
            }, cancellationToken);
        }

        return Ok(new
        {
            success = true,
            message = $"SMS queued for {notifications.Count} recipients.",
            count = notifications.Count
        });
    }

    [HttpPost("send-bulk")]
    public async Task<IActionResult> SendBulkSms([FromBody] SendBulkSmsRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "Message is required." });

        if (string.IsNullOrWhiteSpace(request.RecipientType))
            return BadRequest(new { message = "Recipient type is required." });

        IQueryable<StudentManagement.Domain.Students.Student> query = db.Students.AsNoTracking();

        if (request.RecipientType == "Student")
        {
            if (!string.IsNullOrWhiteSpace(request.ClassFilter))
            {
                var admissionIds = await db.Admissions.AsNoTracking()
                    .Where(a => a.ProgrammeId.ToString() == request.ClassFilter)
                    .Select(a => a.Id)
                    .ToListAsync(cancellationToken);

                query = query.Where(s => admissionIds.Contains(s.Id));
            }
        }

        var recipients = await query.Select(s => s.Id).ToListAsync(cancellationToken);

        if (!recipients.Any())
            return BadRequest(new { message = "No recipients found matching the criteria." });

        var notifications = recipients.Select(recipientId => new Notification
        {
            Title = request.Subject ?? "School Notification",
            Body = request.Message,
            Channel = "SMS",
            RecipientType = request.RecipientType,
            RecipientId = recipientId.ToString(),
            TemplateName = request.TemplateName,
            Status = "Pending",
            CreatedAtUtc = DateTime.UtcNow
        }).ToList();

        db.Notifications.AddRange(notifications);
        await db.SaveChangesAsync(cancellationToken);

        foreach (var notification in notifications)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await SimulateSmsSendAsync(notification, cancellationToken);
                }
                catch
                {
                    notification.Status = "Failed";
                    notification.ErrorMessage = "SMS provider not configured.";
                    await db.SaveChangesAsync(cancellationToken);
                }
            }, cancellationToken);
        }

        return Ok(new
        {
            success = true,
            message = $"SMS queued for {notifications.Count} recipients.",
            count = notifications.Count
        });
    }

    private async Task SimulateSmsSendAsync(Notification notification, CancellationToken cancellationToken)
    {
        await Task.Delay(500, cancellationToken);
        notification.Status = "Sent";
        notification.SentAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }
}

public sealed record SendSmsRequest(string? Subject, string Message, string? RecipientType, string[] RecipientIds, string? TemplateName);
public sealed record SendBulkSmsRequest(string? Subject, string Message, string RecipientType, string? ClassFilter, string? TemplateName);
