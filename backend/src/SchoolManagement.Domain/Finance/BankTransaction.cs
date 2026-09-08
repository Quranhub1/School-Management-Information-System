namespace SchoolManagement.Domain.Finance;

public sealed class BankTransaction
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid BankAccountId { get; init; }
    public DateTime TransactionDate { get; init; }
    public required string Reference { get; init; }
    public string? Description { get; init; }
    public decimal Amount { get; init; }
    public bool IsCredit { get; init; }
    public bool IsReconciled { get; private set; }
    public Guid? BankStatementLineId { get; private set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;

    public void Reconcile(Guid statementLineId)
    {
        if (statementLineId == Guid.Empty) throw new ArgumentException("Statement line is required.", nameof(statementLineId));
        if (IsReconciled) throw new InvalidOperationException("Bank transaction is already reconciled.");
        IsReconciled = true;
        BankStatementLineId = statementLineId;
    }
}
