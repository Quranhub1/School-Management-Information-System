namespace SchoolManagement.Domain.Finance;

public sealed class BankReconciliation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BankAccountId { get; init; }
    public DateTimeOffset StatementDate { get; init; }
    public decimal StatementBalance { get; init; }
    public decimal BookBalance { get; init; }
    public decimal ReconciledAmount { get; set; }
    public string Status { get; init; } = "Pending";
    public DateTimeOffset? ReconciledAt { get; init; }
    public string? ReconciledBy { get; init; }
    public string? Notes { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
