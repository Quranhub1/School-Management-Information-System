using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class FiscalPeriodService(IFiscalPeriodRepository repository)
{
    public Task<IReadOnlyList<FiscalPeriod>> GetAsync(CancellationToken cancellationToken = default) =>
        repository.GetFiscalPeriodsAsync(cancellationToken);

    public async Task<FiscalPeriod> CreateAsync(string name, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Fiscal period name is required.", nameof(name));
        if (endDate < startDate) throw new ArgumentException("Fiscal period end date cannot be before its start date.", nameof(endDate));
        var normalizedName = name.Trim();
        if (await repository.NameExistsAsync(normalizedName, null, cancellationToken)) throw new InvalidOperationException("A fiscal period with this name already exists.");
        if (await repository.HasOverlappingPeriodAsync(startDate, endDate, null, cancellationToken)) throw new InvalidOperationException("Fiscal periods cannot overlap.");
        var period = new FiscalPeriod { Name = normalizedName, StartDate = startDate, EndDate = endDate };
        await repository.AddAsync(period, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return period;
    }

    public async Task<FiscalPeriod> CloseAsync(Guid id, string closedBy, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty) throw new ArgumentException("Fiscal period is required.", nameof(id));
        var period = await repository.GetFiscalPeriodAsync(id, cancellationToken) ?? throw new ArgumentException("Fiscal period was not found.", nameof(id));
        period.Close(closedBy);
        await repository.SaveChangesAsync(cancellationToken);
        return period;
    }

    public async Task<FiscalPeriod> RequireOpenPeriodAsync(DateOnly transactionDate, CancellationToken cancellationToken = default)
    {
        var periods = await repository.GetFiscalPeriodsAsync(cancellationToken);
        if (periods.Count == 0)
        {
            // Rollout-safe behavior: existing installations can continue posting until
            // an administrator explicitly configures fiscal periods. Once any period
            // exists, every posting must belong to an open period.
            return new FiscalPeriod
            {
                Name = "Legacy posting mode",
                StartDate = transactionDate,
                EndDate = transactionDate
            };
        }

        var period = periods.SingleOrDefault(x => x.Contains(transactionDate));
        if (period is null) throw new InvalidOperationException($"No fiscal period contains transaction date {transactionDate:yyyy-MM-dd}.");
        if (!string.Equals(period.Status, "Open", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException($"Fiscal period '{period.Name}' is closed.");
        return period;
    }
}
