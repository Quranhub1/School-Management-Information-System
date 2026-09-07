namespace SchoolManagement.Domain.Finance;

public sealed class BankStatementLine
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BankReconciliationId { get; init; }
    public DateTimeOffset TransactionDate { get; init; }
    public string? Description { get; init; }
    public decimal Amount { get; init; }
    public string TransactionType { get; init; } = string.Empty;
    public string? Reference { get; init; }
    public bool IsMatched { get; set; }
    public Guid? MatchedJournalEntryId { get; set; }
}
