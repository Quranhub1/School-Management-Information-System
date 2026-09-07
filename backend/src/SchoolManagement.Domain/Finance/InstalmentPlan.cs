namespace SchoolManagement.Domain.Finance;

public sealed class InstalmentPlan
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public Guid StudentId { get; init; }
    public decimal TotalAmount { get; init; }
    public string Currency { get; init; } = "UGX";
    public int NumberOfInstalments { get; init; }
    public string Status { get; init; } = "Active";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class InstalmentPayment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid InstalmentPlanId { get; init; }
    public Guid StudentInvoiceId { get; init; }
    public Guid StudentId { get; init; }
    public int InstalmentNumber { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public DateOnly DueDate { get; init; }
    public DateTimeOffset? PaidAt { get; init; }
    public string Status { get; init; } = "Pending";
    public string? ReceiptNumber { get; init; }
    public string? PaymentMethod { get; init; }
    public string? Reference { get; init; }
}
