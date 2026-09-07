namespace SchoolManagement.Domain.Finance;

public sealed class DailyCollection
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateOnly CollectionDate { get; init; }
    public required string CashierName { get; init; }
    public Guid? CashierUserId { get; init; }
    public decimal CashExpected { get; init; }
    public decimal CashActual { get; init; }
    public decimal MobileMoneyTotal { get; init; }
    public decimal BankTotal { get; init; }
    public decimal CardTotal { get; init; }
    public int TransactionCount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string Status { get; init; } = "Draft";
    public string? Notes { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ClosedAt { get; init; }
}

public sealed class DailyCollectionPayment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid DailyCollectionId { get; init; }
    public Guid? PaymentId { get; init; }
    public Guid StudentInvoiceId { get; init; }
    public Guid StudentId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public string PaymentMethod { get; init; } = "Cash";
    public string? ReceiptNumber { get; init; }
    public string? Reference { get; init; }
}
