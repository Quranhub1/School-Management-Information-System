namespace SchoolManagement.Domain.Finance;

public sealed class BankReconciliation
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BankAccountId { get; init; }
    public DateTimeOffset StatementDate { get; init; }
    public decimal StatementBalance { get; init; }
    public decimal BookBalance { get; init; }
    public decimal ReconciledAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTimeOffset? ReconciledAt { get; set; }
    public string? ReconciledBy { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
}
