namespace SchoolManagement.Domain.Finance;

public sealed class Payment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public required string ReceiptNumber { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public required string PaymentMethod { get; init; }
    public string? Reference { get; init; }
    public DateTimeOffset PaidAt { get; init; } = DateTimeOffset.UtcNow;
}
