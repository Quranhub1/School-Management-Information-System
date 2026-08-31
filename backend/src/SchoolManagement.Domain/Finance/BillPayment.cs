namespace SchoolManagement.Domain.Finance;

public sealed class BillPayment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BillId { get; init; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; init; } = string.Empty;
    public string? Reference { get; init; }
    public DateTimeOffset PaidAt { get; init; } = DateTimeOffset.UtcNow;
    public string? PaidBy { get; init; }
    public Bill? Bill { get; init; }
}
