using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record RefundResult(
    Guid PaymentId,
    Guid StudentId,
    Guid? CreditNoteId,
    string RefundNumber,
    decimal Amount,
    string Currency,
    string RefundMethod,
    string? Reference,
    string Reason,
    string Status,
    DateTimeOffset RefundedAt,
    string? RefundedBy);

public sealed class CreditNoteRefundService(IFinanceRepository finance, IFinanceAdjustmentsRepository adjustments, FiscalPeriodService fiscalPeriods)
{
    public async Task<CreditNote> CreateCreditNoteAsync(Guid invoiceId, decimal amount, string reason, string? issuedBy, CancellationToken cancellationToken = default)
    {
        if (invoiceId == Guid.Empty) throw new ArgumentException("Invoice is required.", nameof(invoiceId));
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Credit note amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Credit note reason is required.", nameof(reason));

        var invoice = await finance.GetInvoiceAsync(invoiceId, cancellationToken) ?? throw new ArgumentException("Invoice was not found.");
        var existing = await adjustments.GetCreditNotesAsync(invoiceId, cancellationToken);
        var activeCreditNotes = existing.Where(x => !string.Equals(x.Status, "Cancelled", StringComparison.OrdinalIgnoreCase));
        var remainingCreditable = Math.Max(0, invoice.Amount - activeCreditNotes.Sum(x => x.Amount));
        var normalizedAmount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        if (normalizedAmount > remainingCreditable) throw new ArgumentException($"Credit note exceeds the remaining creditable invoice amount of {remainingCreditable:0.00} {invoice.Currency}.");

        var creditNote = new CreditNote
        {
            StudentInvoiceId = invoice.Id,
            CreditNoteNumber = $"CN-{Guid.NewGuid():N}",
            Amount = normalizedAmount,
            Reason = reason.Trim(),
            Status = "Applied",
            IssuedBy = string.IsNullOrWhiteSpace(issuedBy) ? null : issuedBy.Trim(),
            AppliedAt = DateTimeOffset.UtcNow
        };

        var receivable = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        var revenue = await GetAccountAsync(FinanceAccountCodes.TuitionRevenue, cancellationToken);
        var journal = new JournalEntry
        {
            EntryNumber = creditNote.CreditNoteNumber,
            Description = $"Credit note {creditNote.CreditNoteNumber} for invoice {invoice.InvoiceNumber}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = creditNote.IssuedBy ?? "FinanceService",
            SourceType = "CreditNote",
            SourceId = creditNote.Id,
            Lines =
            [
                new JournalEntryLine { AccountId = revenue.Id, Description = "Credit note revenue reversal", Debit = creditNote.Amount },
                new JournalEntryLine { AccountId = receivable.Id, Description = "Credit note student receivable", Credit = creditNote.Amount }
            ]
        };
        await AddPostedJournalEntryAsync(journal, cancellationToken);
        await adjustments.AddCreditNoteAsync(creditNote, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = invoice.StudentId,
            StudentInvoiceId = invoice.Id,
            EntryType = "CreditNote",
            Description = $"Credit note {creditNote.CreditNoteNumber}: {creditNote.Reason}",
            Amount = -creditNote.Amount,
            Currency = invoice.Currency,
            Reference = creditNote.CreditNoteNumber
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return creditNote;
    }

    public Task<IReadOnlyList<CreditNote>> GetCreditNotesAsync(Guid invoiceId, CancellationToken cancellationToken = default) =>
        adjustments.GetCreditNotesAsync(invoiceId, cancellationToken);

    public async Task<CreditNote> CancelCreditNoteAsync(Guid creditNoteId, string reason, string cancelledBy, CancellationToken cancellationToken = default)
    {
        if (creditNoteId == Guid.Empty) throw new ArgumentException("Credit note id is required.", nameof(creditNoteId));
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("A credit note cancellation reason is required.", nameof(reason));
        if (string.IsNullOrWhiteSpace(cancelledBy)) throw new ArgumentException("The user cancelling the credit note is required.", nameof(cancelledBy));

        var creditNote = await adjustments.GetCreditNoteForUpdateAsync(creditNoteId, cancellationToken)
            ?? throw new ArgumentException("Credit note was not found.");

        if (string.Equals(creditNote.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Credit note '{creditNote.CreditNoteNumber}' has already been cancelled.");
        if (string.Equals(creditNote.Status, "Refunded", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Credit note '{creditNote.CreditNoteNumber}' has already been refunded and cannot be cancelled.");

        var sourceEntries = await finance.GetPostedJournalEntriesAsync(null, null, null, cancellationToken);
        var sourceJournal = sourceEntries.SingleOrDefault(x =>
            string.Equals(x.SourceType, "CreditNote", StringComparison.OrdinalIgnoreCase) && x.SourceId == creditNote.Id);
        if (sourceJournal is null)
            throw new InvalidOperationException($"Posted journal entry for credit note '{creditNote.CreditNoteNumber}' was not found.");

        // Add the reversal to the same DbContext unit of work, but defer SaveChanges
        // until the credit-note audit fields are also updated. This keeps the reversal
        // and cancellation state atomic when SaveChangesAsync fails.
        var reversalService = new JournalReversalService(finance, fiscalPeriods);
        await reversalService.ReverseAsync(sourceJournal.Id, reason, cancelledBy, cancellationToken, saveChanges: false);

        creditNote.Cancel(cancelledBy, reason, DateTimeOffset.UtcNow);
        await finance.SaveChangesAsync(cancellationToken);
        return creditNote;
    }

    public async Task<RefundResult> CreateRefundAsync(Guid paymentId, decimal amount, string refundMethod, string reason, string? reference, string? refundedBy, Guid? creditNoteId = null, CancellationToken cancellationToken = default)
    {
        if (paymentId == Guid.Empty) throw new ArgumentException("Payment is required.", nameof(paymentId));
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Refund amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(refundMethod)) throw new ArgumentException("Refund method is required.", nameof(refundMethod));
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Refund reason is required.", nameof(reason));

        var payment = await finance.GetPaymentAsync(paymentId, cancellationToken) ?? throw new ArgumentException("Payment was not found.");
        var refundEntries = (await finance.GetPostedJournalEntriesAsync(null, null, null, cancellationToken))
            .Where(x => x.SourceType == "Refund" && x.SourceId == paymentId)
            .ToArray();
        var alreadyRefunded = refundEntries.Sum(x => x.Lines.Sum(l => l.Debit));
        var normalizedAmount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
        var refundable = Math.Max(0, payment.Amount - alreadyRefunded);
        if (normalizedAmount > refundable) throw new ArgumentException($"Refund exceeds the refundable payment balance of {refundable:0.00} {payment.Currency}.");

        if (creditNoteId.HasValue)
        {
            var creditNote = await adjustments.GetCreditNoteAsync(creditNoteId.Value, cancellationToken) ?? throw new ArgumentException("Credit note was not found.");
            if (!string.Equals(creditNote.Status, "Applied", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Credit note '{creditNote.CreditNoteNumber}' is not available for refund because its status is '{creditNote.Status}'.");
            var invoice = await finance.GetInvoiceAsync(creditNote.StudentInvoiceId, cancellationToken);
            if (invoice is null || invoice.StudentId != payment.StudentId) throw new InvalidOperationException("Refund credit note and payment must belong to the same student.");
            if (normalizedAmount > creditNote.Amount) throw new ArgumentException("Refund cannot exceed the credit note amount.");
        }

        var refundNumber = $"REF-{Guid.NewGuid():N}";
        var receivable = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        var refundAccount = await GetAccountAsync(ResolvePaymentAccountCode(refundMethod), cancellationToken);
        var journal = new JournalEntry
        {
            EntryNumber = refundNumber,
            Description = $"Student refund {refundNumber}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = string.IsNullOrWhiteSpace(refundedBy) ? "FinanceService" : refundedBy.Trim(),
            SourceType = "Refund",
            SourceId = payment.Id,
            Lines =
            [
                new JournalEntryLine { AccountId = receivable.Id, Description = "Refund student receivable", Debit = normalizedAmount },
                new JournalEntryLine { AccountId = refundAccount.Id, Description = "Refund payment account", Credit = normalizedAmount }
            ]
        };
        await AddPostedJournalEntryAsync(journal, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = payment.StudentId,
            EntryType = "Refund",
            Description = $"Refund {refundNumber}",
            Amount = normalizedAmount,
            Currency = payment.Currency,
            Reference = string.IsNullOrWhiteSpace(reference) ? refundNumber : reference.Trim()
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);

        return new RefundResult(payment.Id, payment.StudentId, creditNoteId, refundNumber, normalizedAmount, payment.Currency, refundMethod.Trim(), string.IsNullOrWhiteSpace(reference) ? null : reference.Trim(), reason.Trim(), "Completed", journal.PostedAt!.Value, refundedBy?.Trim());
    }

    private async Task<Account> GetAccountAsync(string code, CancellationToken cancellationToken) =>
        await finance.GetActiveAccountByCodeAsync(code, cancellationToken) ?? throw new InvalidOperationException($"Required finance account '{code}' is not configured.");

    private async Task AddPostedJournalEntryAsync(JournalEntry entry, CancellationToken cancellationToken)
    {
        if (await finance.JournalEntryNumberExistsAsync(entry.EntryNumber, cancellationToken)) throw new InvalidOperationException($"Journal entry number '{entry.EntryNumber}' already exists.");
        JournalEntryValidator.Validate(entry);
        await fiscalPeriods.RequireOpenPeriodAsync(DateOnly.FromDateTime(entry.EntryDate.UtcDateTime), cancellationToken);
        await finance.AddJournalEntryAsync(entry, cancellationToken);
    }

    private static string ResolvePaymentAccountCode(string refundMethod)
    {
        var method = refundMethod.Trim().ToLowerInvariant();
        if (method is "cash" or "cash refund") return FinanceAccountCodes.Cash;
        if (method.Contains("mobile") || method.Contains("momo") || method.Contains("mtn") || method.Contains("airtel")) return FinanceAccountCodes.MobileMoney;
        if (method.Contains("bank") || method.Contains("transfer") || method.Contains("card") || method.Contains("cheque") || method.Contains("check")) return FinanceAccountCodes.Bank;
        throw new ArgumentException("Unsupported refund method. Use Cash, Bank/Transfer/Card/Cheque, or Mobile Money.");
    }
}
