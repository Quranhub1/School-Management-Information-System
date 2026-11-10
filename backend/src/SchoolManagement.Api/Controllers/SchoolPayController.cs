using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/schoolpay")]
[Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
public sealed class SchoolPayController(
    ISchoolPayService schoolPay,
    SchoolManagementDbContext db,
    IConfiguration configuration) : ControllerBase
{
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveNotification([FromBody] SchoolPayWebhookRequest request, CancellationToken cancellationToken)
    {
        if (request?.Payment is null) return BadRequest("SchoolPay payment payload is required.");
        if (!string.Equals(request.Type, "SCHOOL_FEES", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Only SCHOOL_FEES webhook notifications are supported by this endpoint.");

        var payment = request.Payment;
        if (string.IsNullOrWhiteSpace(payment.SchoolPayReceiptNumber))
            return BadRequest("SchoolPay receipt number is required.");
        if (string.IsNullOrWhiteSpace(payment.SourceChannelTransactionId))
            return BadRequest("SchoolPay source transaction ID is required.");
        if (string.IsNullOrWhiteSpace(payment.SourcePaymentChannel))
            return BadRequest("SchoolPay source payment channel is required.");
        if (payment.Amount <= 0) return BadRequest("Payment amount must be greater than zero.");

        var apiPassword = configuration["SchoolPay:ApiPassword"];
        if (string.IsNullOrWhiteSpace(apiPassword))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "SchoolPay webhook verification is not configured.");

        var expectedSignature = Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(apiPassword + payment.SchoolPayReceiptNumber)))
            .ToLowerInvariant();
        var suppliedSignature = request.Signature?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(suppliedSignature) ||
            suppliedSignature.Length != expectedSignature.Length ||
            !CryptographicOperations.FixedTimeEquals(
                Encoding.ASCII.GetBytes(expectedSignature),
                Encoding.ASCII.GetBytes(suppliedSignature)))
            return Unauthorized("Invalid SchoolPay webhook signature.");

        if (!string.Equals(payment.TransactionCompletionStatus, "Completed", StringComparison.OrdinalIgnoreCase))
            return Ok(new { status = "Ignored", reason = "SchoolPay transaction is not completed." });

        var paymentCode = payment.StudentPaymentCode?.Trim();
        var registrationNumber = payment.StudentRegistrationNumber?.Trim();
        if (string.IsNullOrWhiteSpace(paymentCode) && string.IsNullOrWhiteSpace(registrationNumber))
            return BadRequest("SchoolPay student payment code or registration number is required.");

        var student = await db.Students.IgnoreQueryFilters().SingleOrDefaultAsync(
            x => (!string.IsNullOrWhiteSpace(paymentCode) && x.StudentNumber == paymentCode) ||
                 (!string.IsNullOrWhiteSpace(registrationNumber) && x.StudentNumber == registrationNumber),
            cancellationToken);
        if (student is null)
            return UnprocessableEntity("SchoolPay student payment code/registration number does not match a student in SMIS.");

        try
        {
            var notification = await schoolPay.ProcessNotificationAsync(
                payment.SchoolPayReceiptNumber,
                payment.SchoolPayReceiptNumber,
                student.Id,
                null,
                payment.Amount,
                "UGX",
                string.Empty,
                payment.StudentName,
                JsonSerializer.Serialize(request),
                cancellationToken,
                payment.SourceChannelTransactionId,
                payment.SourcePaymentChannel,
                "PAID");

            return Ok(new
            {
                notification.ExternalReference,
                notification.SchoolPayReference,
                notification.ProviderTransactionId,
                notification.SourceChannel,
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
            notification.SourceChannel,
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
            n.SourceChannel,
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
