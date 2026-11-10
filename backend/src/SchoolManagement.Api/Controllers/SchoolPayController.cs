using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/schoolpay")]
[Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
public sealed class SchoolPayController(
    ISchoolPayService schoolPay,
    IOptions<SchoolPayOptions> schoolPayOptions,
    SchoolManagementDbContext db) : ControllerBase
{
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveNotification([FromBody] SchoolPayWebhookRequest request, CancellationToken cancellationToken)
    {
        if (request?.Payment is null) return BadRequest("SchoolPay payment payload is required.");
        if (!string.Equals(request.Type, "SCHOOL_FEES", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(request.Type, "OTHER_FEES", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Unsupported SchoolPay webhook payment type.");

        var payment = request.Payment;
        if (string.IsNullOrWhiteSpace(payment.SchoolPayReceiptNumber))
            return BadRequest("SchoolPay receipt number is required.");
        if (string.IsNullOrWhiteSpace(payment.SourceChannelTransactionId))
            return BadRequest("SchoolPay source transaction ID is required.");
        if (string.IsNullOrWhiteSpace(payment.SourcePaymentChannel))
            return BadRequest("SchoolPay source payment channel is required.");
        if (payment.Amount <= 0) return BadRequest("Payment amount must be greater than zero.");

        var options = schoolPayOptions.Value;
        if (!options.Enabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "SchoolPay processing is not enabled for this environment.");
        if (!SchoolPayWebhookSignatureValidator.IsValid(request.Signature, options.WebhookSecret, payment.SchoolPayReceiptNumber))
            return Unauthorized("SchoolPay webhook signature is invalid or not configured.");

        if (!string.Equals(payment.TransactionCompletionStatus, "Completed", StringComparison.OrdinalIgnoreCase))
            return Ok(new { status = "Ignored", reason = "SchoolPay transaction is not completed." });

        var paymentCode = payment.StudentPaymentCode?.Trim();
        var registrationNumber = payment.StudentRegistrationNumber?.Trim();
        if (string.IsNullOrWhiteSpace(paymentCode) && string.IsNullOrWhiteSpace(registrationNumber))
            return BadRequest("SchoolPay student payment code or registration number is required.");

        var matchedStudents = await db.Students.IgnoreQueryFilters()
            .Where(x => !x.IsArchived &&
                ((!string.IsNullOrWhiteSpace(paymentCode) && x.StudentNumber == paymentCode) ||
                 (!string.IsNullOrWhiteSpace(registrationNumber) && x.StudentNumber == registrationNumber)))
            .Take(2)
            .ToListAsync(cancellationToken);
        if (matchedStudents.Count != 1)
            return UnprocessableEntity("SchoolPay student payment code/registration number must match exactly one active SMIS student.");

        var student = matchedStudents[0];
        try
        {
            var notification = await schoolPay.ProcessNotificationAsync(
                payment.SchoolPayReceiptNumber,
                payment.SchoolPayReceiptNumber,
                student.Id,
                null,
                payment.Amount,
                "UGX",
                null,
                payment.StudentName,
                payment.SourcePaymentChannel,
                JsonSerializer.Serialize(request),
                cancellationToken,
                payment.SourceChannelTransactionId,
                payment.TransactionCompletionStatus);

            return Ok(new
            {
                notification.ExternalReference,
                notification.SchoolPayReference,
                notification.ProviderTransactionId,
                notification.Channel,
                notification.ProviderStatus,
                notification.Status,
                notification.ProcessedAt
            });
        }
        catch (InvalidOperationException ex) when (
            ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) ||
            ex.Message.Contains("already fully paid", StringComparison.OrdinalIgnoreCase))
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
        return Ok(new
        {
            notification.ExternalReference,
            notification.SchoolPayReference,
            notification.ProviderTransactionId,
            notification.Channel,
            notification.ProviderStatus,
            notification.StudentId,
            notification.StudentInvoiceId,
            notification.Amount,
            notification.Currency,
            notification.Status,
            notification.ReceivedAt,
            notification.ProcessedAt,
            notification.ErrorMessage
        });
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications(CancellationToken cancellationToken)
    {
        var notifications = await schoolPay.GetNotificationsAsync(cancellationToken);
        return Ok(notifications.Select(n => new
        {
            n.ExternalReference,
            n.SchoolPayReference,
            n.ProviderTransactionId,
            n.Channel,
            n.ProviderStatus,
            n.StudentId,
            n.StudentInvoiceId,
            n.Amount,
            n.Currency,
            n.Status,
            n.ReceivedAt,
            n.ProcessedAt,
            n.ErrorMessage
        }));
    }
}

public sealed record SchoolPayWebhookRequest(
    string? Signature,
    string? Type,
    SchoolPayWebhookPayment? Payment);

public sealed record SchoolPayWebhookPayment(
    [property: JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)] decimal Amount,
    string? SchoolPayReceiptNumber,
    string? SourceChannelTransactionId,
    string? SourcePaymentChannel,
    string? StudentPaymentCode,
    string? StudentRegistrationNumber,
    string? StudentName,
    string? TransactionCompletionStatus);
