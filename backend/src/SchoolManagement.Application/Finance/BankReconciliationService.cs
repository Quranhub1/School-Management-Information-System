using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record CreateBankReconciliationRequest(Guid BankAccountId, DateTimeOffset StatementDate, decimal StatementBalance, decimal BookBalance, decimal ReconciledAmount, string? Notes = null);
public sealed record AddBankStatementLineRequest(DateTimeOffset TransactionDate, decimal Amount, string TransactionType, string? Description = null, string? Reference = null);

public sealed class BankReconciliationService(IBankReconciliationRepository repository, IFinanceRepository finance)
{
    public Task<IReadOnlyList<BankReconciliation>> GetAsync(Guid? bankAccountId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default) => repository.GetAsync(bankAccountId, from, to, cancellationToken);
    public Task<IReadOnlyList<BankStatementLine>> GetLinesAsync(Guid reconciliationId, CancellationToken cancellationToken = default) => repository.GetLinesAsync(reconciliationId, cancellationToken);

    public async Task<BankReconciliation> CreateAsync(CreateBankReconciliationRequest request, CancellationToken cancellationToken = default)
    {
        if (request.BankAccountId == Guid.Empty) throw new ArgumentException("Bank account is required.");
        if (request.StatementBalance < 0 || request.BookBalance < 0 || request.ReconciledAmount < 0) throw new ArgumentException("Reconciliation balances cannot be negative.");
        if (request.ReconciledAmount > Math.Min(request.StatementBalance, request.BookBalance)) throw new ArgumentException("Reconciled amount cannot exceed either statement or book balance.");
        var account = await finance.GetActiveAccountByIdAsync(request.BankAccountId, cancellationToken) ?? throw new ArgumentException("The bank account was not found or is inactive.");
        var type = (account.AccountType ?? string.Empty).Trim().ToLowerInvariant();
        if (type is not ("asset" or "assets")) throw new ArgumentException("A bank reconciliation must use an active asset account.");
        var fullyReconciled = request.ReconciledAmount == request.StatementBalance && request.ReconciledAmount == request.BookBalance;
        var result = new BankReconciliation { BankAccountId = request.BankAccountId, StatementDate = request.StatementDate, StatementBalance = request.StatementBalance, BookBalance = request.BookBalance, ReconciledAmount = request.ReconciledAmount, Status = fullyReconciled ? "Reconciled" : "Pending", ReconciledAt = fullyReconciled ? DateTimeOffset.UtcNow : null, Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim() };
        await repository.AddAsync(result, cancellationToken); await repository.SaveChangesAsync(cancellationToken); return result;
    }

    public async Task<BankStatementLine> AddLineAsync(Guid reconciliationId, AddBankStatementLineRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount < 0) throw new ArgumentException("Statement line amount cannot be negative.");
        if (string.IsNullOrWhiteSpace(request.TransactionType)) throw new ArgumentException("Transaction type is required.");
        var reconciliation = await repository.GetAsync(reconciliationId, cancellationToken) ?? throw new KeyNotFoundException("Bank reconciliation was not found.");
        if (string.Equals(reconciliation.Status, "Reconciled", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("A completed reconciliation cannot receive new statement lines.");
        var type = request.TransactionType.Trim();
        if (!type.Equals("Credit", StringComparison.OrdinalIgnoreCase) && !type.Equals("Debit", StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("Transaction type must be Credit or Debit.");
        var line = new BankStatementLine { BankReconciliationId = reconciliationId, TransactionDate = request.TransactionDate, Amount = request.Amount, TransactionType = type, Description = request.Description?.Trim(), Reference = request.Reference?.Trim(), Status = "Unmatched" };
        await repository.AddLineAsync(line, cancellationToken); await repository.SaveChangesAsync(cancellationToken); return line;
    }

    public async Task<BankStatementLine> MatchLineAsync(Guid lineId, Guid journalEntryId, CancellationToken cancellationToken = default)
    {
        if (journalEntryId == Guid.Empty) throw new ArgumentException("Journal entry is required.");
        var line = await repository.GetLineAsync(lineId, cancellationToken) ?? throw new KeyNotFoundException("Bank statement line was not found.");
        var reconciliation = await repository.GetAsync(line.BankReconciliationId, cancellationToken) ?? throw new KeyNotFoundException("Bank reconciliation was not found.");
        if (string.Equals(reconciliation.Status, "Reconciled", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("A completed reconciliation cannot be changed.");
        var entries = await finance.GetPostedJournalEntriesAsync(null, null, null, cancellationToken);
        var entry = entries.SingleOrDefault(x => x.Id == journalEntryId) ?? throw new ArgumentException("The journal entry was not found or is not posted.");
        var expected = line.TransactionType.Equals("Debit", StringComparison.OrdinalIgnoreCase) ? line.Amount : -line.Amount;
        var journalNet = entry.Lines.Where(x => x.AccountId == reconciliation.BankAccountId).Sum(x => x.Debit - x.Credit);
        if (Math.Abs(journalNet - expected) > 0.01m) throw new InvalidOperationException("The journal entry amount does not match the bank statement line for this bank account.");
        line.IsMatched = true; line.MatchedJournalEntryId = journalEntryId; line.Status = "Matched"; line.UpdatedAt = DateTimeOffset.UtcNow;
        await repository.SaveChangesAsync(cancellationToken); return line;
    }

    public async Task<BankReconciliation> ReconcileAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(performedBy)) throw new ArgumentException("The user performing reconciliation is required.");
        var result = await repository.GetAsync(id, cancellationToken) ?? throw new KeyNotFoundException("Bank reconciliation was not found.");
        var lines = await repository.GetLinesAsync(id, cancellationToken);
        var unmatched = lines.Count(x => !x.IsMatched);
        if (unmatched > 0) throw new InvalidOperationException($"All bank statement lines must be matched before reconciliation can be completed. Unmatched lines: {unmatched}.");
        if (result.StatementBalance != result.BookBalance) throw new InvalidOperationException("The statement and book balances must agree before reconciliation can be completed.");
        result.ReconciledAmount = result.StatementBalance; result.Status = "Reconciled"; result.ReconciledAt = DateTimeOffset.UtcNow; result.ReconciledBy = performedBy.Trim();
        await repository.SaveChangesAsync(cancellationToken); return result;
    }
}
