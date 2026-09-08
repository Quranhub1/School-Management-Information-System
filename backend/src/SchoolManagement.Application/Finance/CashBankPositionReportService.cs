using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record CashBankMovement(Guid AccountId, string AccountCode, string AccountName, string AccountType, decimal Debit, decimal Credit);

public sealed record CashBankPositionLine(
    Guid AccountId,
    string AccountCode,
    string AccountName,
    string AccountType,
    decimal OpeningBalance,
    decimal Inflows,
    decimal Outflows,
    decimal NetMovement,
    decimal ClosingBalance,
    string ReconciliationStatus,
    DateTimeOffset? ReconciledAt,
    decimal? StatementBalance,
    decimal? ReconciliationDifference);

public sealed record CashBankPositionReport(
    DateOnly From,
    DateOnly To,
    string Currency,
    IReadOnlyList<CashBankPositionLine> Accounts,
    decimal OpeningCash,
    decimal OpeningBank,
    decimal OpeningMobileMoney,
    decimal CashInflows,
    decimal CashOutflows,
    decimal BankInflows,
    decimal BankOutflows,
    decimal MobileMoneyInflows,
    decimal MobileMoneyOutflows,
    decimal TotalOpeningBalance,
    decimal TotalInflows,
    decimal TotalOutflows,
    decimal NetMovement,
    decimal TotalClosingBalance);

public static class CashBankPositionCalculator
{
    public static CashBankPositionLine Calculate(
        Guid accountId,
        string accountCode,
        string accountName,
        string accountType,
        decimal openingBalance,
        IEnumerable<CashBankMovement> movements,
        string reconciliationStatus = "Not applicable",
        DateTimeOffset? reconciledAt = null,
        decimal? statementBalance = null,
        decimal? reconciliationDifference = null)
    {
        var inflows = movements.Sum(x => x.Debit);
        var outflows = movements.Sum(x => x.Credit);
        var netMovement = inflows - outflows;
        return new CashBankPositionLine(
            accountId,
            accountCode,
            accountName,
            accountType,
            openingBalance,
            inflows,
            outflows,
            netMovement,
            openingBalance + netMovement,
            reconciliationStatus,
            reconciledAt,
            statementBalance,
            reconciliationDifference);
    }
}

public sealed class CashBankPositionReportService(
    IFinanceRepository finance,
    FiscalPeriodService fiscalPeriods,
    IBankReconciliationRepository bankReconciliations)
{
    private static readonly string[] LiquidityAccountCodes =
    [
        FinanceAccountCodes.Cash,
        FinanceAccountCodes.Bank,
        FinanceAccountCodes.MobileMoney
    ];

    public async Task<CashBankPositionReport> GetAsync(
        DateOnly? from = null,
        DateOnly? to = null,
        string currency = "UGX",
        CancellationToken cancellationToken = default,
        Guid? campusId = null,
        Guid? facultyId = null,
        Guid? departmentId = null,
        Guid? programmeId = null)
    {
        if (!string.Equals(currency.Trim(), "UGX", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Cash and bank position reporting currently supports UGX only.", nameof(currency));

        var (effectiveFrom, effectiveTo) = await ResolveRangeAsync(from, to, cancellationToken);
        var openingEntries = await finance.GetPostedJournalEntriesAsync(null, effectiveFrom.AddDays(-1), null, cancellationToken);
        var periodEntries = await finance.GetPostedJournalEntriesAsync(effectiveFrom, effectiveTo, null, cancellationToken);

        var openingBalances = Aggregate(openingEntries, campusId, facultyId, departmentId, programmeId);
        var movements = periodEntries
            .SelectMany(x => x.Lines)
            .Where(x => MatchesDimensions(x, campusId, facultyId, departmentId, programmeId))
            .Where(x => x.Account is not null && LiquidityAccountCodes.Contains(x.Account.Code, StringComparer.OrdinalIgnoreCase))
            .Select(x => new CashBankMovement(x.AccountId, x.Account!.Code, x.Account.Name, x.Account.AccountType, x.Debit, x.Credit))
            .ToList();

        var reconciliations = await bankReconciliations.GetAsync(null, null, effectiveTo, cancellationToken);
        var latestReconciliations = reconciliations
            .GroupBy(x => x.BankAccountId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.StatementDate).ThenByDescending(x => x.CreatedAt).First());

        var lines = new List<CashBankPositionLine>();
        foreach (var code in LiquidityAccountCodes)
        {
            var account = await finance.GetActiveAccountByCodeAsync(code, cancellationToken);
            if (account is null) continue;

            openingBalances.TryGetValue(account.Id, out var opening);
            var accountMovements = movements.Where(x => x.AccountId == account.Id).ToArray();
            latestReconciliations.TryGetValue(account.Id, out var reconciliation);
            var isBank = code.Equals(FinanceAccountCodes.Bank, StringComparison.OrdinalIgnoreCase);
            lines.Add(CashBankPositionCalculator.Calculate(
                account.Id,
                account.Code,
                account.Name,
                account.AccountType,
                opening,
                accountMovements,
                isBank ? reconciliation?.Status ?? "Not reconciled" : "Not applicable",
                isBank ? reconciliation?.ReconciledAt : null,
                isBank ? reconciliation?.StatementBalance : null,
                isBank && reconciliation is not null ? reconciliation.StatementBalance - reconciliation.BookBalance : null));
        }

        var cash = lines.Where(x => x.AccountCode.Equals(FinanceAccountCodes.Cash, StringComparison.OrdinalIgnoreCase)).SingleOrDefault();
        var bank = lines.Where(x => x.AccountCode.Equals(FinanceAccountCodes.Bank, StringComparison.OrdinalIgnoreCase)).SingleOrDefault();
        var mobileMoney = lines.Where(x => x.AccountCode.Equals(FinanceAccountCodes.MobileMoney, StringComparison.OrdinalIgnoreCase)).SingleOrDefault();

        return new CashBankPositionReport(
            effectiveFrom,
            effectiveTo,
            "UGX",
            lines.OrderBy(x => x.AccountCode).ToList(),
            cash?.OpeningBalance ?? 0m,
            bank?.OpeningBalance ?? 0m,
            mobileMoney?.OpeningBalance ?? 0m,
            cash?.Inflows ?? 0m,
            cash?.Outflows ?? 0m,
            bank?.Inflows ?? 0m,
            bank?.Outflows ?? 0m,
            mobileMoney?.Inflows ?? 0m,
            mobileMoney?.Outflows ?? 0m,
            lines.Sum(x => x.OpeningBalance),
            lines.Sum(x => x.Inflows),
            lines.Sum(x => x.Outflows),
            lines.Sum(x => x.NetMovement),
            lines.Sum(x => x.ClosingBalance));
    }

    private async Task<(DateOnly From, DateOnly To)> ResolveRangeAsync(DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (from.HasValue && to.HasValue && to.Value < from.Value)
            throw new ArgumentException("Report end date cannot be before the start date.");

        var effectiveTo = to ?? today;
        var effectiveFrom = from;
        if (!effectiveFrom.HasValue)
        {
            var period = await fiscalPeriods.GetContainingAsync(effectiveTo, cancellationToken);
            effectiveFrom = period?.StartDate ?? effectiveTo;
        }

        return (effectiveFrom.Value, effectiveTo);
    }

    private static Dictionary<Guid, decimal> Aggregate(
        IEnumerable<JournalEntry> entries,
        Guid? campusId,
        Guid? facultyId,
        Guid? departmentId,
        Guid? programmeId)
    {
        var result = new Dictionary<Guid, decimal>();
        foreach (var entry in entries)
        foreach (var line in entry.Lines)
        {
            if (line.Account is null || !LiquidityAccountCodes.Contains(line.Account.Code, StringComparer.OrdinalIgnoreCase)) continue;
            if (!MatchesDimensions(line, campusId, facultyId, departmentId, programmeId)) continue;
            result.TryGetValue(line.AccountId, out var balance);
            result[line.AccountId] = balance + line.Debit - line.Credit;
        }
        return result;
    }

    private static bool MatchesDimensions(JournalEntryLine line, Guid? campusId, Guid? facultyId, Guid? departmentId, Guid? programmeId) =>
        (!campusId.HasValue || line.CampusId == campusId) &&
        (!facultyId.HasValue || line.FacultyId == facultyId) &&
        (!departmentId.HasValue || line.DepartmentId == departmentId) &&
        (!programmeId.HasValue || line.ProgrammeId == programmeId);
}
