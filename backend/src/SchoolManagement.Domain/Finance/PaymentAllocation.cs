namespace SchoolManagement.Domain.Finance;

/// <summary>
/// Links a payment to a specific student invoice. This allows one payment to
/// settle multiple invoices while preserving a complete allocation history.
/// </summary>
public sealed class PaymentAllocation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid PaymentId { get; init; }
    public Guid StudentInvoiceId { get; init; }
    public decimal Amount { get; init; }
    public DateTimeOffset AllocatedAt { get; init; } = DateTimeOffset.UtcNow;
}
