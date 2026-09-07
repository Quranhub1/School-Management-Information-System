using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record ReceivablesAgeingBucket(
    string Bucket,
    int InvoiceCount,
    decimal OutstandingAmount,
    string Currency);

public sealed record ReceivablesAgeingReport(
    DateOnly AsOf,
    IReadOnlyList<ReceivablesAgeingBucket> Buckets,
    decimal TotalOutstanding,
    string Currency);

public sealed record ReceivablesReconciliationReport(
    DateOnly AsOf,
    decimal InvoiceSubledgerBalance,
    decimal ControlAccountBalance,
    decimal Difference,
    bool IsReconciled,
    string Currency,
    string ControlAccountCode,
    string Notes);

public sealed class ReceivablesReportService(IFinanceRepository finance)
{
    public async Task<ReceivablesAgeingReport> GetAgeingAsync(DateOnly? asOf = null, string currency = "UGX", CancellationToken cancellationToken = default)
    {
        var date = asOf ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var normalizedCurrency = NormalizeCurrency(currency);
        var invoices = await finance.GetAllStudentInvoicesAsync(cancellationToken);
        var buckets = new[]
        {
            new AgeingBucket("Current", 0, 0m),
            new AgeingBucket("1-30 days", 0, 0m),
            new AgeingBucket("31-60 days", 0, 0m),
            new AgeingBucket("61-90 days", 0, 0m),
            new AgeingBucket("91-120 days", 0, 0m),
            new AgeingBucket("121+ days", 0, 0m)
        };

        foreach (var invoice in invoices)
        {
            if (!string.Equals(invoice.Currency, normalizedCurrency, StringComparison.OrdinalIgnoreCase)) continue;
            if (DateOnly.FromDateTime(invoice.IssuedAt.UtcDateTime) > date) continue;
            var outstanding = invoice.OutstandingAmount;
            if (outstanding <= 0) continue;
            var days = Math.Max(0, date.DayNumber - DateOnly.FromDateTime(invoice.IssuedAt.UtcDateTime).DayNumber);
            var index = days switch
            {
                0 => 0,
                <= 30 => 1,
                <= 60 => 2,
                <= 90 => 3,
                <= 120 => 4,
                _ => 5
            };
            buckets[index] = buckets[index] with
            {
                InvoiceCount = buckets[index].InvoiceCount + 1,
                OutstandingAmount = buckets[index].OutstandingAmount + outstanding
            };
        }

        return new ReceivablesAgeingReport(
            date,
            buckets.Select(x => new ReceivablesAgeingBucket(x.Name, x.InvoiceCount, decimal.Round(x.OutstandingAmount, 2), normalizedCurrency)).ToList(),
            decimal.Round(buckets.Sum(x => x.OutstandingAmount), 2),
            normalizedCurrency);
    }

    public async Task<ReceivablesReconciliationReport> GetReconciliationAsync(DateOnly? asOf = null, string currency = "UGX", CancellationToken cancellationToken = default)
    {
        var date = asOf ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var normalizedCurrency = NormalizeCurrency(currency);
        var invoices = await finance.GetAllStudentInvoicesAsync(cancellationToken);
        var creditNotes = await finance.GetAllCreditNotesAsync(cancellationToken);
        var payments = await finance.GetPaymentsAsync(cancellationToken: cancellationToken);
        var journals = await finance.GetPostedJournalEntriesAsync(null, date, null, cancellationToken);

        var invoiceSubledger = invoices
            .Where(x => string.Equals(x.Currency, normalizedCurrency, StringComparison.OrdinalIgnoreCase) && DateOnly.FromDateTime(x.IssuedAt.UtcDateTime) <= date)
            .Sum(x => x.OutstandingAmount);

        var creditByInvoice = creditNotes
            .Where(x => x.Status == "Applied")
            .GroupBy(x => x.StudentInvoiceId)
            .ToDictionary(x => x.Key, x => x.Sum(n => n.Amount));

        var refundsByInvoice = new Dictionary<Guid, decimal>();
        var paymentsById = payments.ToDictionary(x => x.Id);
        foreach (var journal in journals.Where(x => x.SourceType == "Refund"))
        {
            if (!journal.SourceId.HasValue || !paymentsById.TryGetValue(journal.SourceId.Value, out var payment)) continue;
            if (!string.Equals(payment.Currency, normalizedCurrency, StringComparison.OrdinalIgnoreCase)) continue;
            var refundAmount = journal.Lines.Sum(x => x.Debit);
            if (payment.StudentInvoiceId.HasValue)
            {
                refundsByInvoice[payment.StudentInvoiceId.Value] = refundsByInvoice.GetValueOrDefault(payment.StudentInvoiceId.Value) + refundAmount;
                continue;
            }
            foreach (var allocation in payment.Allocations)
            {
                refundsByInvoice[allocation.StudentInvoiceId] = refundsByInvoice.GetValueOrDefault(allocation.StudentInvoiceId) +
                    refundAmount * allocation.AllocatedAmount / Math.Max(payment.AllocatedAmount, 1m);
            }
        }

        foreach (var invoice in invoices.Where(x => string.Equals(x.Currency, normalizedCurrency, StringComparison.OrdinalIgnoreCase)))
        {
            invoiceSubledger -= creditByInvoice.GetValueOrDefault(invoice.Id);
            invoiceSubledger += refundsByInvoice.GetValueOrDefault(invoice.Id);
        }

        var controlAccount = await finance.GetActiveAccountByCodeAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        if (controlAccount is null) throw new InvalidOperationException($"Required finance account '{FinanceAccountCodes.StudentReceivables}' is not configured.");

        var controlBalance = journals
            .SelectMany(x => x.Lines)
            .Where(x => x.AccountId == controlAccount.Id)
            .Sum(x => x.Debit - x.Credit);

        var difference = decimal.Round(invoiceSubledger - controlBalance, 2);
        return new ReceivablesReconciliationReport(
            date,
            decimal.Round(invoiceSubledger, 2),
            decimal.Round(controlBalance, 2),
            difference,
            difference == 0,
            normalizedCurrency,
            controlAccount.Code,
            difference == 0
                ? "Invoice receivables subledger reconciles to the Student Receivables control account for the selected currency and date."
                : "Difference requires review of invoices, allocations, credit notes, refunds, opening balances or other receivable postings.");
    }

    private static string NormalizeCurrency(string currency) =>
        string.IsNullOrWhiteSpace(currency) ? throw new ArgumentException("Currency is required.", nameof(currency)) : currency.Trim().ToUpperInvariant();

    private sealed record AgeingBucket(string Name, int InvoiceCount, decimal OutstandingAmount);
}
