namespace SchoolManagement.Domain.Finance;

public sealed class CreditNote
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public required string CreditNoteNumber { get; init; }
    public decimal Amount { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string Status { get; private set; } = "Issued";
    public DateTimeOffset IssuedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? IssuedBy { get; init; }
    public DateTimeOffset? AppliedAt { get; init; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public string? CancelledBy { get; private set; }
    public string? CancellationReason { get; private set; }

    public void Cancel(string cancelledBy, string reason, DateTimeOffset cancelledAt)
    {
        if (string.IsNullOrWhiteSpace(cancelledBy))
            throw new ArgumentException("The user cancelling the credit note is required.", nameof(cancelledBy));
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("A credit note cancellation reason is required.", nameof(reason));
        if (string.Equals(Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Credit note '{CreditNoteNumber}' has already been cancelled.");
        if (string.Equals(Status, "Refunded", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Credit note '{CreditNoteNumber}' has already been refunded and cannot be cancelled.");

        Status = "Cancelled";
        CancelledAt = cancelledAt;
        CancelledBy = cancelledBy.Trim();
        CancellationReason = reason.Trim();
    }
}
