namespace SchoolManagement.Domain.Finance;

public sealed class StudentCharge
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid? StudentInvoiceId { get; set; }
    public required string ChargeType { get; init; }
    public required string Description { get; init; }
    public decimal Amount { get; init; }
    public required string Currency { get; init; }
    public required string Status { get; set; }
    public string? CreatedBy { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? VoidedAt { get; set; }
    public string? VoidedBy { get; set; }
    public string? VoidReason { get; set; }
}
