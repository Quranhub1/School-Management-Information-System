using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record BudgetLineRequest(Guid AccountId, string Category, decimal AllocatedAmount, string? Notes = null);

public sealed record CreateBudgetRequest(Guid DepartmentId, Guid AcademicYearId, string Name, string Currency, DateTimeOffset StartDate, DateTimeOffset EndDate, IReadOnlyCollection<BudgetLineRequest> Lines);

public sealed record BudgetVsActualRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Budget, decimal Actual, decimal Variance, decimal UtilizationPercentage);

public sealed class BudgetService(IBudgetRepository budgets, IFinanceRepository finance)
{
    public Task<IReadOnlyList<Budget>> GetAsync(Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken = default) => budgets.GetAsync(academicYearId, activeOnly, cancellationToken);

    public async Task<Budget> CreateAsync(CreateBudgetRequest request, CancellationToken cancellationToken = default)
    {
        if (request.DepartmentId == Guid.Empty) throw new ArgumentException("Department is required.");
        if (request.AcademicYearId == Guid.Empty) throw new ArgumentException("Academic year is required.");
        if (string.IsNullOrWhiteSpace(request.Name)) throw new ArgumentException("Budget name is required.");
        if (request.EndDate < request.StartDate) throw new ArgumentException("Budget end date cannot be before the start date.");
        if (request.Lines.Count == 0) throw new ArgumentException("At least one budget line is required.");
        if (request.Lines.Any(x => x.AllocatedAmount < 0)) throw new ArgumentException("Budget allocations cannot be negative.");
        if (request.Lines.Select(x => x.AccountId).Distinct().Count() != request.Lines.Count) throw new ArgumentException("Each account may appear only once in a budget.");

        var lines = new List<BudgetLine>();
        foreach (var line in request.Lines)
        {
            var account = await finance.GetActiveAccountByIdAsync(line.AccountId, cancellationToken)
                ?? throw new ArgumentException($"Account '{line.AccountId}' was not found or is inactive.");
            if (string.IsNullOrWhiteSpace(line.Category)) throw new ArgumentException($"Budget category for account '{account.Code}' is required.");
            lines.Add(new BudgetLine { AccountId = account.Id, Category = line.Category.Trim(), AllocatedAmount = line.AllocatedAmount, Notes = line.Notes?.Trim() });
        }

        var budget = new Budget
        {
            DepartmentId = request.DepartmentId,
            AcademicYearId = request.AcademicYearId,
            Name = request.Name.Trim(),
            Currency = string.IsNullOrWhiteSpace(request.Currency) ? "UGX" : request.Currency.Trim().ToUpperInvariant(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            TotalAmount = lines.Sum(x => x.AllocatedAmount),
            Lines = lines
        };
        await budgets.AddAsync(budget, cancellationToken);
        await budgets.SaveChangesAsync(cancellationToken);
        return budget;
    }

    public async Task<IReadOnlyList<BudgetVsActualRow>> GetVsActualAsync(Guid budgetId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default)
    {
        var budget = await budgets.GetAsync(budgetId, cancellationToken) ?? throw new KeyNotFoundException("Budget was not found.");
        var budgetStart = DateOnly.FromDateTime(budget.StartDate.UtcDateTime);
        var budgetEnd = DateOnly.FromDateTime(budget.EndDate.UtcDateTime);
        var start = from ?? budgetStart;
        var end = to ?? budgetEnd;
        if (end < start) throw new ArgumentException("Report end date cannot be before the start date.");
        if (start < budgetStart || end > budgetEnd)
            throw new ArgumentException($"Budget actual reporting range must remain within {budgetStart:yyyy-MM-dd} and {budgetEnd:yyyy-MM-dd}.");

        var journals = await finance.GetPostedJournalEntriesAsync(start, end, null, cancellationToken);
        var actuals = journals.SelectMany(x => x.Lines)
            .GroupBy(x => x.AccountId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Debit - x.Credit));

        var rows = new List<BudgetVsActualRow>();
        foreach (var line in budget.Lines)
        {
            var account = await finance.GetActiveAccountByIdAsync(line.AccountId, cancellationToken)
                ?? throw new KeyNotFoundException($"Budget account '{line.AccountId}' no longer exists or is inactive.");
            var actual = actuals.GetValueOrDefault(line.AccountId);
            var variance = line.AllocatedAmount - actual;
            var utilization = line.AllocatedAmount == 0 ? 0 : actual / line.AllocatedAmount * 100m;
            rows.Add(new BudgetVsActualRow(account.Id, account.Code, account.Name, account.AccountType, line.AllocatedAmount, actual, variance, utilization));
        }
        return rows.OrderBy(x => x.AccountCode).ToList();
    }
}
