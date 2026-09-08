using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record AccountLedgerRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, DateTimeOffset Date, string EntryNumber, string Description, decimal Debit, decimal Credit, decimal Balance, Guid? CampusId = null, Guid? FacultyId = null, Guid? DepartmentId = null, Guid? ProgrammeId = null);
public sealed record TrialBalanceRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Debit, decimal Credit, decimal Balance, Guid? CampusId = null, Guid? FacultyId = null, Guid? DepartmentId = null, Guid? ProgrammeId = null);
public sealed record StudentReceivableRow(Guid StudentId, decimal Invoiced, decimal Paid, decimal Outstanding);
public sealed record IncomeStatementRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Amount);
public sealed record IncomeStatementReport(IReadOnlyList<IncomeStatementRow> Revenue, IReadOnlyList<IncomeStatementRow> Expenses, decimal TotalRevenue, decimal TotalExpenses, decimal NetIncome);
public sealed record BalanceSheetRow(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Balance);
public sealed record BalanceSheetReport(IReadOnlyList<BalanceSheetRow> Assets, IReadOnlyList<BalanceSheetRow> Liabilities, IReadOnlyList<BalanceSheetRow> Equity, decimal TotalAssets, decimal TotalLiabilities, decimal TotalEquity, decimal CurrentPeriodNetIncome, decimal TotalLiabilitiesAndEquity);

public sealed class FinanceReportService(IFinanceRepository finance, FiscalPeriodService fiscalPeriods)
{
    public static void ValidateReportRange(DateOnly from, DateOnly to, FiscalPeriod period)
    {
        if (to < from) throw new ArgumentException("Report end date cannot be before the start date.");
        if (from < period.StartDate || from > period.EndDate || to < period.StartDate || to > period.EndDate)
            throw new ArgumentException($"Report range must remain within fiscal period '{period.Name}' ({period.StartDate:yyyy-MM-dd} to {period.EndDate:yyyy-MM-dd}).");
    }

    public async Task<IReadOnlyList<AccountLedgerRow>> GetGeneralLedgerAsync(DateOnly? from = null, DateOnly? to = null, Guid? accountId = null, CancellationToken cancellationToken = default, Guid? campusId = null, Guid? facultyId = null, Guid? departmentId = null, Guid? programmeId = null)
    {
        (from, to) = await ResolveReportRangeAsync(from, to, cancellationToken);
        var openingEntries = from.HasValue ? await finance.GetPostedJournalEntriesAsync(null, from.Value.AddDays(-1), accountId, cancellationToken) : Array.Empty<JournalEntry>();
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, accountId, cancellationToken);
        var running = BuildOpeningBalances(openingEntries, accountId, campusId, facultyId, departmentId, programmeId);
        var rows = new List<AccountLedgerRow>();
        foreach (var entry in entries.OrderBy(x => x.EntryDate).ThenBy(x => x.EntryNumber))
        foreach (var line in entry.Lines.OrderBy(x => x.Account?.Code).ThenBy(x => x.Id))
        {
            if (!MatchesDimensions(line, campusId, facultyId, departmentId, programmeId)) continue;
            if (accountId.HasValue && line.AccountId != accountId.Value) continue;
            var account = line.Account!;
            var key = DimensionKey.For(line);
            running.TryGetValue((account.Id, key), out var balance);
            balance += line.Debit - line.Credit;
            running[(account.Id, key)] = balance;
            rows.Add(new AccountLedgerRow(account.Id, account.Code, account.Name, account.AccountType, entry.EntryDate, entry.EntryNumber, line.Description ?? entry.Description ?? string.Empty, line.Debit, line.Credit, balance, line.CampusId, line.FacultyId, line.DepartmentId, line.ProgrammeId));
        }
        return rows;
    }

    public async Task<IReadOnlyList<TrialBalanceRow>> GetTrialBalanceAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default, Guid? campusId = null, Guid? facultyId = null, Guid? departmentId = null, Guid? programmeId = null)
    {
        (from, to) = await ResolveReportRangeAsync(from, to, cancellationToken);
        var openingEntries = from.HasValue ? await finance.GetPostedJournalEntriesAsync(null, from.Value.AddDays(-1), null, cancellationToken) : Array.Empty<JournalEntry>();
        var entries = await finance.GetPostedJournalEntriesAsync(from, to, null, cancellationToken);
        var totals = Aggregate(openingEntries.Select(e => FilterEntry(e, campusId, facultyId, departmentId, programmeId)).Concat(entries.Select(e => FilterEntry(e, campusId, facultyId, departmentId, programmeId))));
        return totals.Values.OrderBy(x => x.Account.Code).ThenBy(x => x.Key.CampusId).ThenBy(x => x.Key.FacultyId).ThenBy(x => x.Key.DepartmentId).ThenBy(x => x.Key.ProgrammeId).Select(x => new TrialBalanceRow(x.Account.Id, x.Account.Code, x.Account.Name, x.Account.AccountType, x.Debit, x.Credit, x.Debit - x.Credit, x.Key.CampusId, x.Key.FacultyId, x.Key.DepartmentId, x.Key.ProgrammeId)).ToList();
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

    private async Task<(DateOnly? From, DateOnly? To)> ResolveReportRangeAsync(DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        if (from.HasValue && to.HasValue && to.Value < from.Value) throw new ArgumentException("Report end date cannot be before the start date.");
        if (from.HasValue || to.HasValue)
        {
            var anchor = to ?? from!.Value;
            var period = await fiscalPeriods.GetContainingAsync(anchor, cancellationToken) ?? throw new ArgumentException($"No fiscal period contains report date {anchor:yyyy-MM-dd}.");
            var effectiveFrom = from ?? period.StartDate;
            var effectiveTo = to ?? period.EndDate;
            ValidateReportRange(effectiveFrom, effectiveTo, period);
            return (effectiveFrom, effectiveTo);
        }
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await fiscalPeriods.GetContainingAsync(today, cancellationToken);
        return currentPeriod is null ? (null, null) : (currentPeriod.StartDate, today);
    }

    private static Dictionary<(Guid AccountId, DimensionKey Key), decimal> BuildOpeningBalances(IEnumerable<JournalEntry> entries, Guid? accountId, Guid? campusId, Guid? facultyId, Guid? departmentId, Guid? programmeId)
    {
        var balances = new Dictionary<(Guid AccountId, DimensionKey Key), decimal>();
        foreach (var entry in entries)
        foreach (var line in entry.Lines)
        {
            if (!MatchesDimensions(line, campusId, facultyId, departmentId, programmeId)) continue;
            if (accountId.HasValue && line.AccountId != accountId.Value) continue;
            var key = DimensionKey.For(line);
            balances.TryGetValue((line.AccountId, key), out var balance);
            balances[(line.AccountId, key)] = balance + line.Debit - line.Credit;
        }
        return balances;
    }

    private static JournalEntry FilterEntry(JournalEntry entry, Guid? campusId, Guid? facultyId, Guid? departmentId, Guid? programmeId) => new()
    {
        Id = entry.Id, EntryNumber = entry.EntryNumber, EntryDate = entry.EntryDate, Description = entry.Description, Status = entry.Status, PostedAt = entry.PostedAt, PostedBy = entry.PostedBy, CreatedAt = entry.CreatedAt, SourceType = entry.SourceType, SourceId = entry.SourceId, ReversalOfJournalEntryId = entry.ReversalOfJournalEntryId, Lines = entry.Lines.Where(l => MatchesDimensions(l, campusId, facultyId, departmentId, programmeId)).ToList()
    };

    private static bool MatchesDimensions(JournalEntryLine line, Guid? campusId, Guid? facultyId, Guid? departmentId, Guid? programmeId) => (!campusId.HasValue || line.CampusId == campusId) && (!facultyId.HasValue || line.FacultyId == facultyId) && (!departmentId.HasValue || line.DepartmentId == departmentId) && (!programmeId.HasValue || line.ProgrammeId == programmeId);

    private async Task<(DateOnly? From, DateOnly? To)> ResolveIncomeStatementRangeAsync(DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        if (from.HasValue && to.HasValue && to.Value < from.Value) throw new ArgumentException("Report end date cannot be before the start date.");
        if (from.HasValue || to.HasValue)
        {
            var anchor = to ?? from!.Value;
            var period = await fiscalPeriods.GetContainingAsync(anchor, cancellationToken) ?? throw new ArgumentException($"No fiscal period contains report date {anchor:yyyy-MM-dd}.");
            var effectiveFrom = from ?? period.StartDate;
            var effectiveTo = to ?? period.EndDate;
            ValidateReportRange(effectiveFrom, effectiveTo, period);
            return (effectiveFrom, effectiveTo);
        }
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var currentPeriod = await fiscalPeriods.GetContainingAsync(today, cancellationToken);
        return currentPeriod is null ? (null, null) : (currentPeriod.StartDate, today);
    }

    private sealed record DimensionKey(Guid? CampusId, Guid? FacultyId, Guid? DepartmentId, Guid? ProgrammeId)
    {
        public static DimensionKey For(JournalEntryLine line) => new(line.CampusId, line.FacultyId, line.DepartmentId, line.ProgrammeId);
    }

    private static Dictionary<(Guid AccountId, DimensionKey Key), (Account Account, DimensionKey Key, decimal Debit, decimal Credit)> Aggregate(IEnumerable<JournalEntry> entries)
    {
        var totals = new Dictionary<(Guid AccountId, DimensionKey Key), (Account Account, DimensionKey Key, decimal Debit, decimal Credit)>();
        foreach (var entry in entries)
        foreach (var line in entry.Lines)
        {
            var account = line.Account!;
            var key = DimensionKey.For(line);
            var lookup = (account.Id, key);
            totals.TryGetValue(lookup, out var current);
            totals[lookup] = (account, key, current.Debit + line.Debit, current.Credit + line.Credit);
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
