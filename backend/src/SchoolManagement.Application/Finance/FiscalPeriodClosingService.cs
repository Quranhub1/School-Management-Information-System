using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record CloseFiscalPeriodRequest(Guid FiscalPeriodId, Guid RetainedEarningsAccountId);

public sealed class FiscalPeriodClosingService(IFinanceRepository finance, IFiscalPeriodRepository periods)
{
    public async Task<FiscalPeriod> CloseAsync(CloseFiscalPeriodRequest request, string performedBy, CancellationToken cancellationToken = default)
    {
        if (request.FiscalPeriodId == Guid.Empty) throw new ArgumentException("Fiscal period is required.");
        if (request.RetainedEarningsAccountId == Guid.Empty) throw new ArgumentException("Retained earnings account is required.");
        if (string.IsNullOrWhiteSpace(performedBy)) throw new ArgumentException("The user performing the close is required.");
        var period = await periods.GetFiscalPeriodAsync(request.FiscalPeriodId, cancellationToken) ?? throw new KeyNotFoundException("Fiscal period was not found.");
        if (!string.Equals(period.Status, "Open", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Only an open fiscal period can be closed.");
        var retained = await finance.GetActiveAccountByIdAsync(request.RetainedEarningsAccountId, cancellationToken) ?? throw new ArgumentException("Retained earnings account was not found or is inactive.");
        var retainedType = Normalize(retained.AccountType);
        if (retainedType is not ("equity" or "capital")) throw new ArgumentException("Retained earnings account must be an Equity or Capital account.");

        var entryNumber = $"CLOSE-{period.Id:N}";
        if (await finance.JournalEntryNumberExistsAsync(entryNumber, cancellationToken)) throw new InvalidOperationException($"The fiscal period '{period.Name}' has already been closed or has a closing entry.");

        var entries = await finance.GetPostedJournalEntriesAsync(period.StartDate, period.EndDate, null, cancellationToken);
        var lines = BuildClosingLines(entries, retained.Id);
        var netIncome = lines.Where(x => x.AccountId == retained.Id).Sum(x => x.Credit - x.Debit);

        if (lines.Count > 1 && netIncome != 0)
        {
            var entry = new JournalEntry { EntryNumber = entryNumber, EntryDate = period.EndDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc), Description = $"Fiscal period closing - {period.Name}", Status = "Posted", PostedAt = DateTimeOffset.UtcNow, PostedBy = performedBy.Trim(), Lines = new List<JournalEntryLine>(lines) };
            JournalEntryValidator.Validate(entry);
            await finance.AddJournalEntryAsync(entry, cancellationToken);
            await finance.SaveChangesAsync(cancellationToken);
        }

        period.Close(performedBy);
        await periods.SaveChangesAsync(cancellationToken);
        return period;
    }

    public static IReadOnlyList<JournalEntryLine> BuildClosingLines(IEnumerable<JournalEntry> entries, Guid retainedEarningsAccountId)
    {
        if (retainedEarningsAccountId == Guid.Empty) throw new ArgumentException("Retained earnings account is required.", nameof(retainedEarningsAccountId));

        var balances = entries
            .SelectMany(x => x.Lines)
            .Where(x => x.Account is not null && (IsRevenue(x.Account.AccountType) || IsExpense(x.Account.AccountType)))
            .GroupBy(x => new { x.AccountId, x.CampusId, x.FacultyId, x.DepartmentId, x.ProgrammeId })
            .Select(g => new { g.Key, Account = g.First().Account!, Debit = g.Sum(x => x.Debit), Credit = g.Sum(x => x.Credit) })
            .Where(x => x.Debit != x.Credit)
            .ToList();

        var result = new List<JournalEntryLine>();
        foreach (var item in balances.Where(x => IsRevenue(x.Account.AccountType)))
            result.Add(new JournalEntryLine { AccountId = item.Key.AccountId, Description = $"Close revenue - {item.Account.Name}", Debit = item.Credit > item.Debit ? item.Credit - item.Debit : 0m, Credit = item.Debit > item.Credit ? item.Debit - item.Credit : 0m, CampusId = item.Key.CampusId, FacultyId = item.Key.FacultyId, DepartmentId = item.Key.DepartmentId, ProgrammeId = item.Key.ProgrammeId });

        foreach (var item in balances.Where(x => IsExpense(x.Account.AccountType)))
            result.Add(new JournalEntryLine { AccountId = item.Key.AccountId, Description = $"Close expense - {item.Account.Name}", Debit = item.Credit > item.Debit ? item.Credit - item.Debit : 0m, Credit = item.Debit > item.Credit ? item.Debit - item.Credit : 0m, CampusId = item.Key.CampusId, FacultyId = item.Key.FacultyId, DepartmentId = item.Key.DepartmentId, ProgrammeId = item.Key.ProgrammeId });

        var netIncomeByDimension = balances
            .GroupBy(x => new { x.Key.CampusId, x.Key.FacultyId, x.Key.DepartmentId, x.Key.ProgrammeId })
            .Select(g => new { g.Key, Amount = g.Sum(x => IsRevenue(x.Account.AccountType) ? x.Credit - x.Debit : x.Debit - x.Credit) })
            .Where(x => x.Amount != 0m);

        foreach (var item in netIncomeByDimension)
            result.Add(new JournalEntryLine { AccountId = retainedEarningsAccountId, Description = item.Amount > 0 ? "Transfer net income to retained earnings" : "Transfer net loss from retained earnings", Debit = item.Amount < 0 ? -item.Amount : 0m, Credit = item.Amount > 0 ? item.Amount : 0m, CampusId = item.Key.CampusId, FacultyId = item.Key.FacultyId, DepartmentId = item.Key.DepartmentId, ProgrammeId = item.Key.ProgrammeId });

        return result;
    }

    private static string Normalize(string? type) => (type ?? string.Empty).Trim().ToLowerInvariant();
    private static bool IsRevenue(string? type) => Normalize(type) is "revenue" or "income";
    private static bool IsExpense(string? type) => Normalize(type) is "expense" or "expenses" or "cost" or "costofgoods";
}
