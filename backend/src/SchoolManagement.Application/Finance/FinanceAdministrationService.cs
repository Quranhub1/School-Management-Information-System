using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FinanceAdministrationService(IFinanceAdministrationRepository repository)
{
    public async Task<IReadOnlyList<Budget>> GetBudgetsAsync(Guid? departmentId, Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken)
        => await repository.GetBudgetsAsync(departmentId, academicYearId, activeOnly, cancellationToken);

    public async Task<Budget> CreateBudgetAsync(Guid departmentId, Guid academicYearId, string name, decimal totalAmount, string currency, DateTimeOffset startDate, DateTimeOffset endDate, CancellationToken cancellationToken)
    {
        ValidatePeriod(name, totalAmount, currency, startDate, endDate);
        var budget = new Budget { DepartmentId = departmentId, AcademicYearId = academicYearId, Name = name.Trim(), TotalAmount = totalAmount, Currency = currency.Trim().ToUpperInvariant(), StartDate = startDate, EndDate = endDate };
        await repository.AddBudgetAsync(budget, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return budget;
    }

    public async Task<BudgetLine> AddBudgetLineAsync(Guid budgetId, Guid accountId, string category, decimal allocatedAmount, string? notes, CancellationToken cancellationToken)
    {
        if (allocatedAmount <= 0) throw new ArgumentException("Allocated amount must be greater than zero.", nameof(allocatedAmount));
        if (string.IsNullOrWhiteSpace(category)) throw new ArgumentException("Category is required.", nameof(category));
        var budget = await repository.GetBudgetAsync(budgetId, cancellationToken) ?? throw new ArgumentException("Budget was not found.", nameof(budgetId));
        if (!budget.IsActive) throw new InvalidOperationException("Inactive budgets cannot receive new allocations.");
        if (budget.Lines.Any(x => x.AccountId == accountId)) throw new InvalidOperationException("The account already has a line in this budget. Add to the existing allocation instead of duplicating the account.");
        if (budget.Lines.Sum(x => x.AllocatedAmount) + allocatedAmount > budget.TotalAmount) throw new InvalidOperationException("Budget lines cannot exceed the approved budget total.");
        var line = new BudgetLine { BudgetId = budgetId, AccountId = accountId, Category = category.Trim(), AllocatedAmount = allocatedAmount, Notes = notes?.Trim() };
        await repository.AddBudgetLineAsync(line, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return line;
    }

    public async Task<IReadOnlyList<BankReconciliation>> GetBankReconciliationsAsync(Guid? bankAccountId, CancellationToken cancellationToken)
        => await repository.GetBankReconciliationsAsync(bankAccountId, cancellationToken);

    public async Task<IReadOnlyList<BankStatementLine>> GetBankStatementLinesAsync(Guid reconciliationId, CancellationToken cancellationToken)
    {
        if (reconciliationId == Guid.Empty) throw new ArgumentException("Reconciliation ID is required.", nameof(reconciliationId));
        if (await repository.GetBankReconciliationAsync(reconciliationId, cancellationToken) is null) throw new ArgumentException("Bank reconciliation was not found.", nameof(reconciliationId));
        return await repository.GetBankStatementLinesAsync(reconciliationId, cancellationToken);
    }

    public async Task<BankReconciliation> CreateBankReconciliationAsync(Guid bankAccountId, DateTimeOffset statementDate, decimal statementBalance, CancellationToken cancellationToken)
    {
        if (bankAccountId == Guid.Empty) throw new ArgumentException("Bank account is required.", nameof(bankAccountId));
        if (statementBalance < 0) throw new ArgumentException("Statement balance cannot be negative.", nameof(statementBalance));
        var journals = await repository.GetPostedJournalsForAccountAsync(bankAccountId, DateTimeOffset.MinValue, statementDate, cancellationToken);
        var bookBalance = journals.SelectMany(x => x.Lines).Where(x => x.AccountId == bankAccountId).Sum(x => x.Debit - x.Credit);
        var reconciliation = new BankReconciliation { BankAccountId = bankAccountId, StatementDate = statementDate, StatementBalance = statementBalance, BookBalance = bookBalance, ReconciledAmount = 0, Status = "Pending" };
        await repository.AddBankReconciliationAsync(reconciliation, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return reconciliation;
    }

    public async Task<BankStatementLine> AddStatementLineAsync(Guid reconciliationId, DateTimeOffset transactionDate, string? description, decimal amount, string transactionType, string? reference, CancellationToken cancellationToken)
    {
        var reconciliation = await repository.GetBankReconciliationAsync(reconciliationId, cancellationToken) ?? throw new ArgumentException("Bank reconciliation was not found.", nameof(reconciliationId));
        if (reconciliation.Status.Equals("Reconciled", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("A reconciled bank statement is closed and cannot receive new lines.");
        if (amount <= 0) throw new ArgumentException("Statement amount must be greater than zero.", nameof(amount));
        var type = transactionType.Trim();
        if (!type.Equals("Credit", StringComparison.OrdinalIgnoreCase) && !type.Equals("Debit", StringComparison.OrdinalIgnoreCase)) throw new ArgumentException("Transaction type must be Credit or Debit.", nameof(transactionType));
        if (transactionDate > reconciliation.StatementDate) throw new ArgumentException("Statement line cannot be after the statement date.", nameof(transactionDate));
        var line = new BankStatementLine { BankReconciliationId = reconciliationId, TransactionDate = transactionDate, Description = description?.Trim(), Amount = amount, TransactionType = char.ToUpperInvariant(type[0]) + type[1..].ToLowerInvariant(), Reference = reference?.Trim() };
        await repository.AddBankStatementLineAsync(line, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return line;
    }

    public async Task<BankReconciliation> MatchStatementLineAsync(Guid reconciliationId, Guid statementLineId, Guid journalEntryId, CancellationToken cancellationToken)
    {
        var reconciliation = await repository.GetBankReconciliationAsync(reconciliationId, cancellationToken) ?? throw new ArgumentException("Bank reconciliation was not found.", nameof(reconciliationId));
        if (reconciliation.Status.Equals("Reconciled", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("A reconciled bank statement is closed and cannot be changed.");
        var lines = await repository.GetBankStatementLinesAsync(reconciliationId, cancellationToken);
        var line = lines.FirstOrDefault(x => x.Id == statementLineId) ?? throw new ArgumentException("Statement line was not found in this reconciliation.", nameof(statementLineId));
        if (line.IsMatched) throw new InvalidOperationException("Statement line is already matched.");
        if (await repository.IsJournalAlreadyMatchedAsync(journalEntryId, cancellationToken)) throw new InvalidOperationException("The selected journal entry is already matched to another bank statement line.");
        var journals = await repository.GetPostedJournalsForAccountAsync(reconciliation.BankAccountId, line.TransactionDate.AddDays(-1), line.TransactionDate.AddDays(1), cancellationToken);
        var journal = journals.FirstOrDefault(x => x.Id == journalEntryId) ?? throw new ArgumentException("Posted journal entry was not found for the bank account.", nameof(journalEntryId));
        var bankEffect = journal.Lines.Where(x => x.AccountId == reconciliation.BankAccountId).Sum(x => x.Debit - x.Credit);
        var statementEffect = line.TransactionType.Equals("Credit", StringComparison.OrdinalIgnoreCase) ? line.Amount : -line.Amount;
        if (Math.Abs(bankEffect - statementEffect) > 0.01m) throw new InvalidOperationException("Statement line amount does not match the selected bank journal entry.");
        line.IsMatched = true;
        line.MatchedJournalEntryId = journalEntryId;
        reconciliation.ReconciledAmount += statementEffect;
        reconciliation.Status = "Pending";
        await repository.SaveChangesAsync(cancellationToken);
        return reconciliation;
    }

    public async Task<BankReconciliation> CloseBankReconciliationAsync(Guid reconciliationId, string closedBy, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(closedBy)) throw new ArgumentException("Closing user identity is required.", nameof(closedBy));
        var reconciliation = await repository.GetBankReconciliationAsync(reconciliationId, cancellationToken) ?? throw new ArgumentException("Bank reconciliation was not found.", nameof(reconciliationId));
        if (reconciliation.Status.Equals("Reconciled", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Bank reconciliation is already closed.");
        var lines = await repository.GetBankStatementLinesAsync(reconciliationId, cancellationToken);
        if (lines.Count == 0 || lines.Any(x => !x.IsMatched)) throw new InvalidOperationException("Every bank statement line must be matched before the reconciliation can be closed.");
        if (Math.Abs(reconciliation.StatementBalance - reconciliation.BookBalance) > 0.01m) throw new InvalidOperationException("The statement and book balances must agree within UGX 0.01 before closing.");
        reconciliation.Status = "Reconciled";
        reconciliation.ReconciledAt = DateTimeOffset.UtcNow;
        reconciliation.ReconciledBy = closedBy.Trim();
        await repository.SaveChangesAsync(cancellationToken);
        return reconciliation;
    }

    private static void ValidatePeriod(string name, decimal totalAmount, string currency, DateTimeOffset startDate, DateTimeOffset endDate)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Budget name is required.", nameof(name));
        if (totalAmount <= 0) throw new ArgumentException("Budget total must be greater than zero.", nameof(totalAmount));
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.", nameof(currency));
        if (endDate < startDate) throw new ArgumentException("Budget end date cannot be before its start date.", nameof(endDate));
    }
}
