namespace SchoolManagement.Domain.Finance;

public sealed class AccountingDimension
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string DimensionType { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}

public sealed class JournalLineDimension
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid JournalEntryLineId { get; init; }
    public Guid AccountingDimensionId { get; init; }
}
