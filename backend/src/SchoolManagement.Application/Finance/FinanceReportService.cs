using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record AccountLedgerRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, DateTimeOffset Date, string EntryNumber, string Description, decimal Debit, decimal Credit, decimal Balance, Guid? CampusId = null, Guid? FacultyId = null, Guid? DepartmentId = null, Guid? ProgrammeId = null);
public sealed record TrialBalanceRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Debit, decimal Credit, decimal Balance);
public sealed record StudentReceivableRow(Guid StudentId, decimal Invoiced, decimal Paid, decimal Outstanding);
public sealed record IncomeStatementRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Amount);
public sealed record IncomeStatementReport(IReadOnlyList<IncomeStatementRow> Revenue, IReadOnlyList<IncomeStatementRow> Expenses, decimal TotalRevenue, decimal TotalExpenses, decimal NetIncome);
public sealed record BalanceSheetRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Balance);
public sealed record BalanceSheetReport(IReadOnlyList<BalanceSheetRow> Assets, IReadOnlyList<BalanceSheetRow> Liabilities, IReadOnlyList<BalanceSheetRow> Equity, decimal TotalAssets, decimal TotalLiabilities, decimal TotalEquity, decimal CurrentPeriodNetIncome, decimal TotalLiabilitiesAndEquity);

public sealed class FinanceReportService(IFinanceRepository finance, FiscalPeriodService fiscalPeriods)
{
    public async Task<IReadOnlyList<AccountLedgerRow>> GetGeneralLedgerAsync(DateOnly? from = null, DateOnly? to = null, Guid? accountId = null, CancellationToken cancellationToken = default, Guid? campusId = null, Guid? facultyId = null, Guid? departmentId = null, Guid? programmeId = null)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, accountId, cancellationToken);
        var rows = new List<AccountLedgerRow>();
        var running = new Dictionary<Guid, decimal>();
        foreach (var entry in entries.OrderBy(x => x.EntryDate).ThenBy(x => x.EntryNumber))
        foreach (var line in entry.Lines)
        {
            if (!MatchesDimensions(line, campusId, facultyId, departmentId, programmeId)) continue;
            if (accountId.HasValue && line.AccountId != accountId.Value) continue;
            var account = line.Account!;
            running.TryGetValue(account.Id, out var balance);
            balance += line.Debit - line.Credit;
            running[account.Id] = balance;
            rows.Add(new AccountLedgerRow(account.Id, account.Code, account.Name, account.AccountType, entry.EntryDate, entry.EntryNumber, line.Description ?? entry.Description ?? string.Empty, line.Debit, line.Credit, balance, line.CampusId, line.FacultyId, line.DepartmentId, line.ProgrammeId));
        }
        return rows;
    }

    public async Task<IReadOnlyList<TrialBalanceRow>> GetTrialBalanceAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default, Guid? campusId = null, Guid? facultyId = null, Guid? departmentId = null, Guid? programmeId = null)
    {
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, null, cancellationToken);
        var filtered = entries.Select(e => FilterEntry(e, campusId, facultyId, departmentId, programmeId)).Where(e => e.Lines.Count > 0).ToList();
        var totals = Aggregate(filtered);
        return totals.Values.OrderBy(x => x.Account.Code).Select(x => new TrialBalanceRow(x.Account.Id, x.Account.Code, x.Account.Name, x.Account.AccountType, x.Debit, x.Credit, x.Debit - x.Credit)).ToList();
    }

    public async Task<IncomeStatementReport> GetIncomeStatementAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default, Guid? campusId = null, Guid? facultyId = null, Guid? departmentId = null, Guid? programmeId = null)
    {
        (from, to) = await ResolveIncomeStatementRangeAsync(from, to, cancellationToken);
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, null, cancellationToken);
        var rows = Aggregate(entries.Select(e => FilterEntry(e, campusId, facultyId, departmentId, programmeId))).Values.Select(x => new IncomeStatementRow(x.Account.Id, x.Account.Code, x.Account.Name, x.Account.AccountType, IsCreditNormal(x.Account.AccountType) ? x.Credit - x.Debit : x.Debit - x.Credit)).Where(x => IsRevenue(x.AccountType) || IsExpense(x.AccountType)).OrderBy(x => x.AccountCode).ToList();
        var revenue = rows.Where(x => IsRevenue(x.AccountType)).ToList();
        var expenses = rows.Where(x => IsExpense(x.AccountType)).ToList();
        var totalRevenue = revenue.Sum(x => x.Amount);
        var totalExpenses = expenses.Sum(x => x.Amount);
        return new IncomeStatementReport(revenue, expenses, totalRevenue, totalExpenses, totalRevenue - totalExpenses);
    }

    public async Task<BalanceSheetReport> GetBalanceSheetAsync(DateOnly? asOf = null, CancellationToken cancellationToken = default, Guid? campusId = null, Guid? facultyId = null, Guid? departmentId = null, Guid? programmeId = null)
    {
        var effectiveAsOf = asOf ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var entries = await finance.GetPostedJournalEntriesAsync(null, effectiveAsOf, null, cancellationToken);
        var totals = Aggregate(entries.Select(e => FilterEntry(e, campusId, facultyId, departmentId, programmeId))).Values.Select(x => new BalanceSheetRow(x.Account.Id, x.Account.Code, x.Account.Name, x.Account.AccountType, IsCreditNormal(x.Account.AccountType) ? x.Credit - x.Debit : x.Debit - x.Credit)).Where(x => IsAsset(x.AccountType) || IsLiability(x.AccountType) || IsEquity(x.AccountType)).OrderBy(x => x.AccountCode).ToList();
        var assets = totals.Where(x => IsAsset(x.AccountType)).ToList();
        var liabilities = totals.Where(x => IsLiability(x.AccountType)).ToList();
        var equity = totals.Where(x => IsEquity(x.AccountType)).ToList();
        var netIncome = await GetIncomeStatementAsync(null, effectiveAsOf, cancellationToken, campusId, facultyId, departmentId, programmeId);
        var totalAssets = assets.Sum(x => x.Balance);
        var totalLiabilities = liabilities.Sum(x => x.Balance);
        var totalEquity = equity.Sum(x => x.Balance);
        return new BalanceSheetReport(assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, netIncome.NetIncome, totalLiabilities + totalEquity + netIncome.NetIncome);
    }

    public async Task<IReadOnlyList<StudentReceivableRow>> GetStudentReceivablesAsync(CancellationToken cancellationToken = default)
    {
        var invoices = await finance.GetAllStudentInvoicesAsync(cancellationToken);
        return invoices.GroupBy(x => x.StudentId).Select(g => new StudentReceivableRow(g.Key, g.Sum(x => x.Amount), g.Sum(x => x.PaidAmount), g.Sum(x => x.Amount - x.PaidAmount))).OrderByDescending(x => x.Outstanding).ToList();
    }

    private static JournalEntry FilterEntry(JournalEntry entry, Guid? campusId, Guid? facultyId, Guid? departmentId, Guid? programmeId) => new()
    {
        Id = entry.Id,
        EntryNumber = entry.EntryNumber,
        EntryDate = entry.EntryDate,
        Description = entry.Description,
        Status = entry.Status,
        PostedAt = entry.PostedAt,
        PostedBy = entry.PostedBy,
        CreatedAt = entry.CreatedAt,
        SourceType = entry.SourceType,
        SourceId = entry.SourceId,
        ReversalOfJournalEntryId = entry.ReversalOfJournalEntryId,
        Lines = entry.Lines.Where(l => MatchesDimensions(l, campusId, facultyId, departmentId, programmeId)).ToList()
    };

    private static bool MatchesDimensions(JournalEntryLine line, Guid? campusId, Guid? facultyId, Guid? departmentId, Guid? programmeId) =>
        (!campusId.HasValue || line.CampusId == campusId) &&
        (!facultyId.HasValue || line.FacultyId == facultyId) &&
        (!departmentId.HasValue || line.DepartmentId == departmentId) &&
        (!programmeId.HasValue || line.ProgrammeId == programmeId);

    private async Task<(DateOnly? From, DateOnly? To)> ResolveIncomeStatementRangeAsync(DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        if (to.HasValue)
        {
            var period = await fiscalPeriods.GetContainingAsync(to.Value, cancellationToken);
            if (period is not null && (!from.HasValue || from.Value < period.StartDate)) from = period.StartDate;
        }
        else if (!from.HasValue)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var period = await fiscalPeriods.GetContainingAsync(today, cancellationToken);
            if (period is not null) { from = period.StartDate; to = today; }
        }
        return (from, to);
    }

    private static Dictionary<Guid, (Account Account, decimal Debit, decimal Credit)> Aggregate(IEnumerable<JournalEntry> entries)
    {
        var totals = new Dictionary<Guid, (Account Account, decimal Debit, decimal Credit)>();
        foreach (var entry in entries)
        foreach (var line in entry.Lines)
        {
            var account = line.Account!;
            totals.TryGetValue(account.Id, out var current);
            totals[account.Id] = (account, current.Debit + line.Debit, current.Credit + line.Credit);
        }
        return totals;
    }

    private static string Normalize(string? type) => (type ?? string.Empty).Trim().ToLowerInvariant();
    private static bool IsAsset(string? type) => Normalize(type) is "asset" or "assets";
    private static bool IsLiability(string? type) => Normalize(type) is "liability" or "liabilities";
    private static bool IsEquity(string? type) => Normalize(type) is "equity" or "capital";
    private static bool IsRevenue(string? type) => Normalize(type) is "revenue" or "income";
    private static bool IsExpense(string? type) => Normalize(type) is "expense" or "expenses" or "cost" or "costofgoods";
    private static bool IsCreditNormal(string? type) => IsLiability(type) || IsEquity(type) || IsRevenue(type);
}
