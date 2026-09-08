using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed record OpeningBalanceLineRequest(
    Guid AccountId,
    decimal Debit,
    decimal Credit,
    string? Description = null,
    Guid? CampusId = null,
    Guid? FacultyId = null,
    Guid? DepartmentId = null,
    Guid? ProgrammeId = null);

public sealed class OpeningBalanceService(IFinanceRepository finance, FiscalPeriodService fiscalPeriods)
{
    public async Task<JournalEntry> CreateAsync(
        Guid fiscalPeriodId,
        IReadOnlyCollection<OpeningBalanceLineRequest> lines,
        string performedBy,
        CancellationToken cancellationToken = default)
    {
        if (fiscalPeriodId == Guid.Empty) throw new ArgumentException("Fiscal period is required.", nameof(fiscalPeriodId));
        if (lines.Count < 2) throw new ArgumentException("At least two opening-balance lines are required.", nameof(lines));
        if (string.IsNullOrWhiteSpace(performedBy)) throw new ArgumentException("The user performing the operation is required.", nameof(performedBy));
        if (lines.Any(x => x.AccountId == Guid.Empty)) throw new ArgumentException("Every opening-balance line requires an account.", nameof(lines));
        if (lines.Any(x => x.Debit < 0 || x.Credit < 0)) throw new ArgumentException("Opening-balance amounts cannot be negative.");
        if (lines.Any(x => x.Debit > 0 && x.Credit > 0)) throw new ArgumentException("An opening-balance line cannot contain both debit and credit.");
        if (lines.All(x => x.Debit == 0 && x.Credit == 0)) throw new ArgumentException("Opening-balance amounts must contain at least one non-zero value.");

        var periods = await fiscalPeriods.GetAsync(cancellationToken);
        var period = periods.SingleOrDefault(x => x.Id == fiscalPeriodId) ?? throw new ArgumentException("Fiscal period was not found.", nameof(fiscalPeriodId));
        if (!string.Equals(period.Status, "Open", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException($"Fiscal period '{period.Name}' is closed.");

        var totalDebit = lines.Sum(x => x.Debit);
        var totalCredit = lines.Sum(x => x.Credit);
        if (totalDebit != totalCredit) throw new ArgumentException($"Opening balances must balance. Debit={totalDebit:0.00}, Credit={totalCredit:0.00}.");

        var entryNumber = $"OPEN-{period.Id:N}";
        if (await finance.JournalEntryNumberExistsAsync(entryNumber, cancellationToken))
            throw new InvalidOperationException($"Opening balances have already been posted for fiscal period '{period.Name}'.");

        var entry = new JournalEntry
        {
            EntryNumber = entryNumber,
            EntryDate = period.StartDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            Description = $"Opening balances - {period.Name}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = performedBy.Trim(),
            SourceType = "OpeningBalance",
            SourceId = fiscalPeriodId
        };

        foreach (var request in lines)
        {
            var account = await finance.GetActiveAccountByIdAsync(request.AccountId, cancellationToken)
                ?? throw new ArgumentException($"Account '{request.AccountId}' was not found or is inactive.");
            var type = (account.AccountType ?? string.Empty).Trim().ToLowerInvariant();
            if (type is not ("asset" or "assets" or "liability" or "liabilities" or "equity" or "capital"))
                throw new ArgumentException($"Opening balance account '{account.Code}' must be an Asset, Liability, or Equity account.");

            entry.Lines.Add(new JournalEntryLine
            {
                AccountId = account.Id,
                Description = string.IsNullOrWhiteSpace(request.Description) ? $"Opening balance - {account.Name}" : request.Description.Trim(),
                Debit = request.Debit,
                Credit = request.Credit,
                CampusId = request.CampusId,
                FacultyId = request.FacultyId,
                DepartmentId = request.DepartmentId,
                ProgrammeId = request.ProgrammeId
            });
        }

        JournalEntryValidator.Validate(entry);
        await finance.AddJournalEntryAsync(entry, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return entry;
    }
}
