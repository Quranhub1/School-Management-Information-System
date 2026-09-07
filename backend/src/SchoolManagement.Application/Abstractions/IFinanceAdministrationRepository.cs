using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Abstractions;

public interface IFinanceAdministrationRepository
{
    Task<IReadOnlyList<Budget>> GetBudgetsAsync(Guid? departmentId, Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken);
    Task<Budget?> GetBudgetAsync(Guid budgetId, CancellationToken cancellationToken);
    Task AddBudgetAsync(Budget budget, CancellationToken cancellationToken);
    Task AddBudgetLineAsync(BudgetLine line, CancellationToken cancellationToken);
    Task<IReadOnlyList<BankReconciliation>> GetBankReconciliationsAsync(Guid? bankAccountId, CancellationToken cancellationToken);
    Task<BankReconciliation?> GetBankReconciliationAsync(Guid id, CancellationToken cancellationToken);
    Task AddBankReconciliationAsync(BankReconciliation reconciliation, CancellationToken cancellationToken);
    Task AddBankStatementLineAsync(BankStatementLine line, CancellationToken cancellationToken);
    Task<IReadOnlyList<BankStatementLine>> GetBankStatementLinesAsync(Guid reconciliationId, CancellationToken cancellationToken);
    Task<IReadOnlyList<JournalEntry>> GetPostedJournalsForAccountAsync(Guid accountId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
