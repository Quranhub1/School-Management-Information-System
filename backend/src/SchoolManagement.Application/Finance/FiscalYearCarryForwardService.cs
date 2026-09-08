using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record CarryForwardRequest(
    Guid SourceFiscalPeriodId,
    Guid TargetFiscalPeriodId,
    string PerformedBy);

/// <summary>
/// Carries closing balance-sheet balances from one fiscal period into the next
/// by creating a controlled opening-balance journal in the target period.
/// Income and expense accounts are deliberately excluded because the closing
/// workflow transfers the period result to retained earnings.
/// </summary>
public sealed class FiscalYearCarryForwardService(
    IFinanceRepository finance,
    IFiscalPeriodRepository periods,
    OpeningBalanceService openingBalances)
{
    public async Task<JournalEntry> CarryForwardAsync(
        CarryForwardRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.SourceFiscalPeriodId == Guid.Empty)
            throw new ArgumentException("Source fiscal period is required.", nameof(request));
        if (request.TargetFiscalPeriodId == Guid.Empty)
            throw new ArgumentException("Target fiscal period is required.", nameof(request));
        if (request.SourceFiscalPeriodId == request.TargetFiscalPeriodId)
            throw new ArgumentException("Source and target fiscal periods must be different.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.PerformedBy))
            throw new ArgumentException("The user performing the carry-forward is required.", nameof(request));

        var source = await periods.GetFiscalPeriodAsync(request.SourceFiscalPeriodId, cancellationToken)
            ?? throw new KeyNotFoundException("Source fiscal period was not found.");
        var target = await periods.GetFiscalPeriodAsync(request.TargetFiscalPeriodId, cancellationToken)
            ?? throw new KeyNotFoundException("Target fiscal period was not found.");

        if (!string.Equals(source.Status, "Closed", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Source fiscal period '{source.Name}' must be closed before carry-forward.");
        if (!string.Equals(target.Status, "Open", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Target fiscal period '{target.Name}' must be open.");
        if (target.StartDate != source.EndDate.AddDays(1))
            throw new InvalidOperationException("The target fiscal period must begin on the day after the source fiscal period ends.");

        var sourceEntries = await finance.GetPostedJournalEntriesAsync(
            source.StartDate,
            source.EndDate,
            null,
            cancellationToken);

        var lines = BuildOpeningBalanceLines(sourceEntries);
        if (lines.Count == 0)
            throw new InvalidOperationException($"Fiscal period '{source.Name}' has no balance-sheet balances to carry forward.");

        var entry = await openingBalances.CreateAsync(
            target.Id,
            lines,
            request.PerformedBy.Trim(),
            cancellationToken);

        return entry;
    }

    internal static IReadOnlyList<OpeningBalanceLineRequest> BuildOpeningBalanceLines(
        IEnumerable<JournalEntry> entries)
    {
        var balances = entries
            .SelectMany(entry => entry.Lines)
            .Where(line => line.Account is not null && IsBalanceSheetAccount(line.Account.AccountType))
            .GroupBy(line => new
            {
                line.AccountId,
                line.CampusId,
                line.FacultyId,
                line.DepartmentId,
                line.ProgrammeId
            })
            .Select(group => new
            {
                group.Key,
                Account = group.First().Account!,
                Balance = group.Sum(line => line.Debit - line.Credit)
            })
            .Where(x => x.Balance != 0m)
            .ToList();

        return balances
            .Select(x => new OpeningBalanceLineRequest(
                x.Key.AccountId,
                x.Balance > 0m ? x.Balance : 0m,
                x.Balance < 0m ? -x.Balance : 0m,
                $"Opening balance - {x.Account.Name}",
                x.Key.CampusId,
                x.Key.FacultyId,
                x.Key.DepartmentId,
                x.Key.ProgrammeId))
            .ToList();
    }

    private static bool IsBalanceSheetAccount(string? accountType) =>
        (accountType ?? string.Empty).Trim().ToLowerInvariant() is
            "asset" or "assets" or "liability" or "liabilities" or "equity" or "capital";
}
