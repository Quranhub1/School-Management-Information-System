namespace SchoolManagement.Domain.Finance;

public sealed class BudgetLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BudgetId { get; init; }
    public Guid AccountId { get; init; }
    public required string Category { get; init; }
    public decimal AllocatedAmount { get; init; }
    public decimal SpentAmount { get; set; }
    public string? Notes { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
