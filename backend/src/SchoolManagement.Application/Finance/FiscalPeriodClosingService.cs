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
        var retainedType = (retained.AccountType ?? string.Empty).Trim().ToLowerInvariant();
        if (retainedType is not ("equity" or "capital")) throw new ArgumentException("Retained earnings account must be an Equity or Capital account.");

        var entryNumber = $"CLOSE-{period.Id:N}";
        if (await finance.JournalEntryNumberExistsAsync(entryNumber, cancellationToken)) throw new InvalidOperationException($"The fiscal period '{period.Name}' has already been closed or has a closing entry.");

        var entries = await finance.GetPostedJournalEntriesAsync(period.StartDate, period.EndDate, null, cancellationToken);
        var balances = entries.SelectMany(x => x.Lines).GroupBy(x => x.AccountId).Select(g => new { AccountId = g.Key, Debit = g.Sum(x => x.Debit), Credit = g.Sum(x => x.Credit), Account = g.First().Account! }).ToList();
        var revenue = balances.Where(x => IsRevenue(x.Account.AccountType)).ToList();
        var expenses = balances.Where(x => IsExpense(x.Account.AccountType)).ToList();
        var netIncome = revenue.Sum(x => x.Credit - x.Debit) - expenses.Sum(x => x.Debit - x.Credit);
        var lines = new List<JournalEntryLine>();
        foreach (var item in revenue.Where(x => x.Credit != x.Debit)) lines.Add(new JournalEntryLine { AccountId = item.AccountId, Description = $"Close revenue - {item.Account.Name}", Debit = item.Credit - item.Debit, Credit = 0 });
        foreach (var item in expenses.Where(x => x.Debit != x.Credit)) lines.Add(new JournalEntryLine { AccountId = item.AccountId, Description = $"Close expense - {item.Account.Name}", Debit = 0, Credit = item.Debit - item.Credit });
        if (netIncome >= 0) lines.Add(new JournalEntryLine { AccountId = retained.Id, Description = "Transfer net income to retained earnings", Debit = 0, Credit = netIncome });
        else lines.Add(new JournalEntryLine { AccountId = retained.Id, Description = "Transfer net loss from retained earnings", Debit = -netIncome, Credit = 0 });

        if (lines.Count > 1 && netIncome != 0)
        {
            var entry = new JournalEntry { EntryNumber = entryNumber, EntryDate = period.EndDate.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc), Description = $"Fiscal period closing - {period.Name}", Status = "Posted", PostedAt = DateTimeOffset.UtcNow, PostedBy = performedBy.Trim(), SourceType = "FiscalPeriodClosing", SourceId = period.Id, Lines = lines };
            JournalEntryValidator.Validate(entry);
            await finance.AddJournalEntryAsync(entry, cancellationToken);
            await finance.SaveChangesAsync(cancellationToken);
        }

        period.Close(performedBy);
        await periods.SaveChangesAsync(cancellationToken);
        return period;
    }

    private static string Normalize(string? type) => (type ?? string.Empty).Trim().ToLowerInvariant();
    private static bool IsRevenue(string? type) => Normalize(type) is "revenue" or "income";
    private static bool IsExpense(string? type) => Normalize(type) is "expense" or "expenses" or "cost" or "costofgoods";
}
