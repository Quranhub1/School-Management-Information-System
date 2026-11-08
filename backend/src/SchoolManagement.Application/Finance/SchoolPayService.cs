using SchoolManagement.Application.Abstractions;

namespace SchoolManagement.Application.Finance;

public sealed class SchoolPayService(IFinanceRepository finance, FinanceService financeService) : ISchoolPayService
{
    public async Task<SchoolPayPaymentResult> ProcessNotificationAsync(string externalReference, string schoolPayReference, Guid? studentId, Guid? studentInvoiceId, decimal amount, string currency, string phoneNumber, string? payerName, string rawPayload, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(externalReference)) throw new ArgumentException("External reference is required.");
        if (string.IsNullOrWhiteSpace(schoolPayReference)) throw new ArgumentException("SchoolPay reference is required.");
        if (amount <= 0) throw new ArgumentException("Payment amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.");

        var normalizedExternalRef = externalReference.Trim();
        var receiptNumber = $"SP-{normalizedExternalRef.Substring(0, Math.Min(normalizedExternalRef.Length, 12))}";

        if (await IsProcessedAsync(normalizedExternalRef, cancellationToken))
        {
            return new SchoolPayPaymentResult(normalizedExternalRef, "Processed", null, null);
        }

        try
        {
            if (studentInvoiceId.HasValue)
            {
                await financeService.RecordPaymentAsync(studentInvoiceId.Value, receiptNumber, amount, "SchoolPay", schoolPayReference, cancellationToken);
            }
            else if (studentId.HasValue)
            {
                await financeService.RecordUnallocatedPaymentAsync(studentId.Value, receiptNumber, amount, currency, "SchoolPay", schoolPayReference, cancellationToken);
            }
            else
            {
                throw new InvalidOperationException("SchoolPay notification must include either a student ID or a student invoice ID.");
            }

            return new SchoolPayPaymentResult(normalizedExternalRef, "Processed", DateTimeOffset.UtcNow, null);
        }
        catch (Exception ex)
        {
            return new SchoolPayPaymentResult(normalizedExternalRef, "Failed", DateTimeOffset.UtcNow, ex.Message);
        }
    }

    public async Task<bool> IsProcessedAsync(string externalReference, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(externalReference)) throw new ArgumentException("External reference is required.");
        var receiptNumber = $"SP-{externalReference.Trim().Substring(0, Math.Min(externalReference.Trim().Length, 12))}";
        var payments = await finance.GetPaymentsAsync(receiptNumber: receiptNumber, paymentMethod: "SchoolPay", cancellationToken: cancellationToken);
        return payments.Any();
    }
}
