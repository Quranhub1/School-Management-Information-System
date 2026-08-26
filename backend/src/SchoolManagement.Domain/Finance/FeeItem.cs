namespace SchoolManagement.Domain.Finance;

public sealed class FeeItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid FeeStructureId { get; init; }
    public required string Name { get; init; }
    public required string FeeType { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "UGX";
    public int DisplayOrder { get; init; }
    public bool IsActive { get; set; } = true;
}

public sealed class StudentFee
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; init; }
    public Guid StudentInvoiceId { get; init; }
    public Guid? FeeItemId { get; init; }
    public required string FeeType { get; init; }
    public required string Name { get; init; }
    public decimal Amount { get; init; }
    public decimal PaidAmount { get; set; }
    public string Currency { get; init; } = "UGX";
    public string Status { get; set; } = "Unpaid";
    public DateTimeOffset IssuedAt { get; init; } = DateTimeOffset.UtcNow;
}
