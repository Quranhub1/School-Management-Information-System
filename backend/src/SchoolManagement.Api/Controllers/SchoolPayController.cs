using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/schoolpay")]
[Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
public sealed class SchoolPayController(ISchoolPayService schoolPay, IOptions<SchoolPayOptions> schoolPayOptions) : ControllerBase
{
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveNotification([FromBody] SchoolPayNotificationRequest request, CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest("Notification payload is required.");
        if (string.IsNullOrWhiteSpace(request.ExternalReference)) return BadRequest("External reference is required.");
        if (string.IsNullOrWhiteSpace(request.SchoolPayReference)) return BadRequest("SchoolPay reference is required.");
        if (request.Amount <= 0) return BadRequest("Amount must be greater than zero.");
        if (!schoolPayOptions.Value.Enabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "SchoolPay processing is not enabled for this environment.");
        if (!string.Equals(request.Status, "PAID", StringComparison.OrdinalIgnoreCase))
            return Conflict("Only confirmed PAID SchoolPay transactions can be posted.");
        if (!SchoolPayWebhookSignatureValidator.IsValid(request.Signature, schoolPayOptions.Value.WebhookSecret, request.SchoolPayReference))
            return Unauthorized("SchoolPay webhook signature is invalid or not configured.");

        Guid? studentId = null;
        Guid? studentInvoiceId = null;
        if (!string.IsNullOrWhiteSpace(request.StudentId) && Guid.TryParse(request.StudentId, out var parsedStudentId)) studentId = parsedStudentId;
        if (!string.IsNullOrWhiteSpace(request.StudentInvoiceId) && Guid.TryParse(request.StudentInvoiceId, out var parsedInvoiceId)) studentInvoiceId = parsedInvoiceId;
        if (studentId is null && studentInvoiceId is null) return BadRequest("Either studentId or studentInvoiceId is required.");

        try
        {
            var notification = await schoolPay.ProcessNotificationAsync(
                request.ExternalReference,
                request.SchoolPayReference,
                studentId,
                studentInvoiceId,
                request.Amount,
                request.Currency ?? "UGX",
                request.PhoneNumber,
                request.PayerName,
                request.Channel,
                request.RawPayload,
                cancellationToken);
            return Ok(new { notification.ExternalReference, notification.Status, notification.ProcessedAt });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("already fully paid", StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("notifications/{externalReference}")]
    public async Task<IActionResult> GetNotification(string externalReference, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(externalReference)) return BadRequest("External reference is required.");
        var notification = await schoolPay.GetNotificationAsync(externalReference, cancellationToken);
        if (notification is null) return NotFound();
        return Ok(new { notification.ExternalReference, notification.SchoolPayReference, notification.StudentId, notification.StudentInvoiceId, notification.Amount, notification.Currency, notification.Channel, notification.Status, notification.ReceivedAt, notification.ProcessedAt, notification.ErrorMessage });
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var notifications = await schoolPay.GetNotificationsAsync(cancellationToken);
        return Ok(notifications.Select(n => new { n.ExternalReference, n.SchoolPayReference, n.StudentId, n.StudentInvoiceId, n.Amount, n.Currency, n.Channel, n.Status, n.ReceivedAt, n.ProcessedAt, n.ErrorMessage }));
    }
}

public sealed record SchoolPayNotificationRequest(
    string ExternalReference,
    string SchoolPayReference,
    string? StudentId,
    string? StudentInvoiceId,
    decimal Amount,
    string? Currency,
    string? PhoneNumber,
    string? PayerName,
    string? Channel,
    string? RawPayload,
    string? Status,
    string? Signature);
