namespace SchoolManagement.Domain.Finance;

public sealed class PaymentAllocation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid PaymentId { get; init; }
    public Guid StudentInvoiceId { get; init; }
    public decimal AllocatedAmount { get; init; }
    public string Currency { get; init; } = "UGX";
    public DateTimeOffset AllocatedAt { get; init; } = DateTimeOffset.UtcNow;
    public string? Notes { get; init; }
}
