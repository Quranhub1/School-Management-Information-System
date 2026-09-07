using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record CreateBankReconciliationRequest(
    Guid BankAccountId,
    DateTimeOffset StatementDate,
    decimal StatementBalance,
    decimal BookBalance,
    decimal ReconciledAmount,
    string? Notes = null);

public sealed record AddBankStatementLineRequest(
    DateTimeOffset TransactionDate,
    decimal Amount,
    string TransactionType,
    string? Description = null,
    string? Reference = null);

public sealed class BankReconciliationService(IBankReconciliationRepository repository, IFinanceRepository finance)
{
    public Task<IReadOnlyList<BankReconciliation>> GetAsync(Guid? bankAccountId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default) =>
        repository.GetAsync(bankAccountId, from, to, cancellationToken);

    public async Task<BankReconciliation> CreateAsync(CreateBankReconciliationRequest request, CancellationToken cancellationToken = default)
    {
        if (request.BankAccountId == Guid.Empty) throw new ArgumentException("Bank account is required.");
        if (request.StatementBalance < 0 || request.BookBalance < 0 || request.ReconciledAmount < 0)
            throw new ArgumentException("Reconciliation balances cannot be negative.");
        if (request.ReconciledAmount > Math.Min(request.StatementBalance, request.BookBalance))
            throw new ArgumentException("Reconciled amount cannot exceed either statement or book balance.");

        var account = await finance.GetActiveAccountByIdAsync(request.BankAccountId, cancellationToken)
            ?? throw new ArgumentException("The bank account was not found or is inactive.");
        var type = (account.AccountType ?? string.Empty).Trim().ToLowerInvariant();
        if (type is not ("asset" or "assets")) throw new ArgumentException("A bank reconciliation must use an active asset account.");

        var result = new BankReconciliation
        {
            BankAccountId = request.BankAccountId,
            StatementDate = request.StatementDate,
            StatementBalance = request.StatementBalance,
            BookBalance = request.BookBalance,
            ReconciledAmount = request.ReconciledAmount,
            Status = request.ReconciledAmount == request.StatementBalance && request.ReconciledAmount == request.BookBalance ? "Reconciled" : "Pending",
            ReconciledAt = request.ReconciledAmount == request.StatementBalance && request.ReconciledAmount == request.BookBalance ? DateTimeOffset.UtcNow : null,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
        };
        await repository.AddAsync(result, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<BankReconciliation> ReconcileAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(performedBy)) throw new ArgumentException("The user performing reconciliation is required.");
        var result = await repository.GetAsync(id, cancellationToken) ?? throw new KeyNotFoundException("Bank reconciliation was not found.");
        if (result.StatementBalance != result.BookBalance)
            throw new InvalidOperationException("The statement and book balances must agree before reconciliation can be completed.");
        result.ReconciledAmount = result.StatementBalance;
        result.Status = "Reconciled";
        result.ReconciledAt = DateTimeOffset.UtcNow;
        result.ReconciledBy = performedBy.Trim();
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
