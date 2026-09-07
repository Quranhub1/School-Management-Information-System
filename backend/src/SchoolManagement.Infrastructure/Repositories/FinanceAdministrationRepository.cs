using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class FinanceAdministrationRepository(SchoolManagementDbContext db) : IFinanceAdministrationRepository
{
    public async Task<IReadOnlyList<Budget>> GetBudgetsAsync(Guid? departmentId, Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken)
    {
        var query = db.Budgets.AsNoTracking().Include(x => x.Lines).AsQueryable();
        if (departmentId.HasValue) query = query.Where(x => x.DepartmentId == departmentId.Value);
        if (academicYearId.HasValue) query = query.Where(x => x.AcademicYearId == academicYearId.Value);
        if (activeOnly) query = query.Where(x => x.IsActive);
        return await query.OrderByDescending(x => x.StartDate).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public Task<Budget?> GetBudgetAsync(Guid budgetId, CancellationToken cancellationToken) =>
        db.Budgets.Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == budgetId, cancellationToken);

    public async Task AddBudgetAsync(Budget budget, CancellationToken cancellationToken) => await db.Budgets.AddAsync(budget, cancellationToken);

    public async Task AddBudgetLineAsync(BudgetLine line, CancellationToken cancellationToken) => await db.BudgetLines.AddAsync(line, cancellationToken);

    public async Task<IReadOnlyList<BankReconciliation>> GetBankReconciliationsAsync(Guid? bankAccountId, CancellationToken cancellationToken)
    {
        var query = db.BankReconciliations.AsNoTracking().AsQueryable();
        if (bankAccountId.HasValue) query = query.Where(x => x.BankAccountId == bankAccountId.Value);
        return await query.OrderByDescending(x => x.StatementDate).ToListAsync(cancellationToken);
    }

    public Task<BankReconciliation?> GetBankReconciliationAsync(Guid id, CancellationToken cancellationToken) =>
        db.BankReconciliations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddBankReconciliationAsync(BankReconciliation reconciliation, CancellationToken cancellationToken) => await db.BankReconciliations.AddAsync(reconciliation, cancellationToken);

    public async Task AddBankStatementLineAsync(BankStatementLine line, CancellationToken cancellationToken) => await db.BankStatementLines.AddAsync(line, cancellationToken);

    public async Task<IReadOnlyList<BankStatementLine>> GetBankStatementLinesAsync(Guid reconciliationId, CancellationToken cancellationToken) =>
        await db.BankStatementLines.Where(x => x.BankReconciliationId == reconciliationId).OrderBy(x => x.TransactionDate).ThenBy(x => x.Id).ToListAsync(cancellationToken);

    public Task<bool> IsJournalAlreadyMatchedAsync(Guid journalEntryId, CancellationToken cancellationToken) =>
        db.BankStatementLines.AnyAsync(x => x.MatchedJournalEntryId == journalEntryId, cancellationToken);

    public async Task<IReadOnlyList<JournalEntry>> GetPostedJournalsForAccountAsync(Guid accountId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken) =>
        await db.JournalEntries.AsNoTracking().Include(x => x.Lines).Where(x => x.Status == "Posted" && x.EntryDate >= from && x.EntryDate <= to && x.Lines.Any(l => l.AccountId == accountId)).OrderBy(x => x.EntryDate).ThenBy(x => x.EntryNumber).ToListAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
