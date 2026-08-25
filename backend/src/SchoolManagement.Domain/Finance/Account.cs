namespace SchoolManagement.Domain.Finance;

public sealed class Account
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ChartOfAccountsId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? ParentAccountId { get; init; }
    public string AccountType { get; init; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
