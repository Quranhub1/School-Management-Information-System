using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class InvoiceDiscountService(IFinanceRepository finance)
{
    public Task<IReadOnlyList<InvoiceDiscount>> GetAsync(Guid invoiceId, CancellationToken cancellationToken) =>
        finance.GetInvoiceDiscountsAsync(invoiceId, cancellationToken);

    public async Task<InvoiceDiscount> RequestAsync(Guid invoiceId, string discountType, decimal? percentage, decimal? amount, string reason, string? requestedBy, CancellationToken cancellationToken)
    {
        var invoice = await finance.GetInvoiceAsync(invoiceId, cancellationToken) ?? throw new ArgumentException("Invoice was not found.");
        if (invoice.OutstandingAmount <= 0) throw new InvalidOperationException("Invoice has no outstanding balance available for a discount.");
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("A discount reason is required.");
        if (string.IsNullOrWhiteSpace(discountType)) throw new ArgumentException("Discount type is required.");

        var hasPercentage = percentage.HasValue;
        var hasAmount = amount.HasValue;
        if (hasPercentage == hasAmount) throw new ArgumentException("Provide exactly one of percentage or amount.");
        if (hasPercentage && (percentage!.Value <= 0 || percentage.Value > 100)) throw new ArgumentException("Percentage must be greater than zero and no more than 100.");
        if (hasAmount && amount!.Value <= 0) throw new ArgumentException("Discount amount must be greater than zero.");

        var requestedAmount = hasPercentage
            ? Math.Round(invoice.OutstandingAmount * percentage!.Value / 100m, 2, MidpointRounding.AwayFromZero)
            : amount!.Value;
        if (requestedAmount > invoice.OutstandingAmount) throw new ArgumentException("Discount cannot exceed the invoice outstanding balance.");

        var discount = new InvoiceDiscount
        {
            StudentInvoiceId = invoice.Id,
            DiscountType = discountType.Trim(),
            Percentage = percentage,
            Amount = requestedAmount,
            Reason = reason.Trim(),
            Status = "Pending",
            RequestedBy = string.IsNullOrWhiteSpace(requestedBy) ? null : requestedBy.Trim()
        };
        await finance.AddInvoiceDiscountAsync(discount, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return discount;
    }

    public async Task<InvoiceDiscount> ApproveAsync(Guid discountId, string approvedBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(approvedBy)) throw new ArgumentException("Approving user is required.");
        var discount = await finance.GetInvoiceDiscountAsync(discountId, cancellationToken) ?? throw new ArgumentException("Discount request was not found.");
        if (!string.Equals(discount.Status, "Pending", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Only pending discount requests can be approved.");

        var invoice = await finance.GetInvoiceAsync(discount.StudentInvoiceId, cancellationToken) ?? throw new ArgumentException("Invoice was not found.");
        var outstanding = invoice.OutstandingAmount;
        if (outstanding <= 0) throw new InvalidOperationException("Invoice has no outstanding balance available for this discount.");
        if (discount.Amount > outstanding) throw new InvalidOperationException("The approved discount exceeds the current invoice outstanding balance.");

        var discountAccount = await finance.GetActiveAccountByCodeAsync(FinanceAccountCodes.DiscountAllowed, cancellationToken)
            ?? throw new InvalidOperationException($"Required finance account '{FinanceAccountCodes.DiscountAllowed}' is not configured.");
        var receivableAccount = await finance.GetActiveAccountByCodeAsync(FinanceAccountCodes.StudentReceivables, cancellationToken)
            ?? throw new InvalidOperationException($"Required finance account '{FinanceAccountCodes.StudentReceivables}' is not configured.");

        var entry = new JournalEntry
        {
            EntryNumber = $"DISC-{discount.Id:N}"[..Math.Min(50, $"DISC-{discount.Id:N}".Length)],
            Description = $"Discount {discount.DiscountType} for invoice {invoice.InvoiceNumber}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = approvedBy.Trim(),
            SourceType = "InvoiceDiscount",
            SourceId = discount.Id
        };
        entry.Lines.Add(new JournalEntryLine { AccountId = discountAccount.Id, Description = $"Discount allowed - {invoice.InvoiceNumber}", Debit = discount.Amount });
        entry.Lines.Add(new JournalEntryLine { AccountId = receivableAccount.Id, Description = $"Reduce receivable - {invoice.InvoiceNumber}", Credit = discount.Amount });
        JournalEntryValidator.Validate(entry);
        if (await finance.JournalEntryNumberExistsAsync(entry.EntryNumber, cancellationToken)) throw new InvalidOperationException("A journal entry already exists for this discount.");

        invoice.DiscountAmount += discount.Amount;
        invoice.Status = invoice.PaidAmount >= invoice.NetAmount ? "Paid" : invoice.PaidAmount > 0 ? "PartiallyPaid" : "Unpaid";
        discount.Status = "Approved";
        discount.ApprovedBy = approvedBy.Trim();
        discount.ApprovedAt = DateTimeOffset.UtcNow;
        discount.ApprovalJournalEntryId = entry.Id;

        await finance.AddJournalEntryAsync(entry, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return discount;
    }

    public async Task<InvoiceDiscount> RejectAsync(Guid discountId, string rejectedBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rejectedBy)) throw new ArgumentException("Rejecting user is required.");
        var discount = await finance.GetInvoiceDiscountAsync(discountId, cancellationToken) ?? throw new ArgumentException("Discount request was not found.");
        if (!string.Equals(discount.Status, "Pending", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Only pending discount requests can be rejected.");
        discount.Status = "Rejected";
        discount.ApprovedBy = rejectedBy.Trim();
        discount.ApprovedAt = DateTimeOffset.UtcNow;
        await finance.SaveChangesAsync(cancellationToken);
        return discount;
    }
}
