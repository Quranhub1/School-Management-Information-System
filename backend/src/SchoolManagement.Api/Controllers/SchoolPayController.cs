using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Finance;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/schoolpay")]
[Authorize(Policy = AuthorizationPolicies.FinanceOperations)]
public sealed class SchoolPayController(ISchoolPayService schoolPay) : ControllerBase
{
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveNotification([FromBody] SchoolPayNotificationRequest request, CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest("Notification payload is required.");
        if (string.IsNullOrWhiteSpace(request.ExternalReference)) return BadRequest("External reference is required.");
        if (string.IsNullOrWhiteSpace(request.SchoolPayReference)) return BadRequest("SchoolPay reference is required.");
        if (request.Amount <= 0) return BadRequest("Amount must be greater than zero.");

        Guid? studentId = null;
        Guid? studentInvoiceId = null;
        if (!string.IsNullOrWhiteSpace(request.StudentId) && Guid.TryParse(request.StudentId, out var parsedStudentId)) studentId = parsedStudentId;
        if (!string.IsNullOrWhiteSpace(request.StudentInvoiceId) && Guid.TryParse(request.StudentInvoiceId, out var parsedInvoiceId)) studentInvoiceId = parsedInvoiceId;
        if (studentId is null && studentInvoiceId is null) return BadRequest("Either studentId or studentInvoiceId is required.");

        try
        {
            var result = await schoolPay.ProcessNotificationAsync(
                request.ExternalReference,
                request.SchoolPayReference,
                studentId,
                studentInvoiceId,
                request.Amount,
                request.Currency ?? "UGX",
                request.PhoneNumber,
                request.PayerName,
                request.RawPayload,
                cancellationToken);
            return Ok(new { result.ExternalReference, result.Status, result.ProcessedAt, result.ErrorMessage });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
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
    string? RawPayload);
