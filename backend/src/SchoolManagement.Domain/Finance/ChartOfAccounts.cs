namespace SchoolManagement.Domain.Finance;

public sealed class ChartOfAccounts
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public required string Code { get; init; }
    public string? Description { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
