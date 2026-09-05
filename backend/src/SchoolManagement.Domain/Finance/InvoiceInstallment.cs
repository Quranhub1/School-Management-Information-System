namespace SchoolManagement.Domain.Finance;

public sealed class InvoiceInstallment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentInvoiceId { get; init; }
    public int Sequence { get; init; }
    public DateOnly DueDate { get; init; }
    public decimal Percentage { get; init; }
    public decimal Amount { get; init; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public decimal OutstandingAmount => Math.Max(0, Amount - PaidAmount);
    public bool IsOverdue(DateOnly asOf) => OutstandingAmount > 0 && DueDate < asOf;
}
