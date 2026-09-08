using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;
using Xunit;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class FiscalPeriodServiceTests
{
    [Fact]
    public async Task RequireOpenPeriod_rejects_posting_when_no_period_is_configured()
    {
        var repository = new InMemoryFiscalPeriodRepository();
        var service = new FiscalPeriodService(repository);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RequireOpenPeriodAsync(new DateOnly(2026, 9, 8)));

        Assert.Contains("No fiscal period is configured", exception.Message);
    }

    [Fact]
    public async Task RequireOpenPeriod_rejects_posting_outside_configured_period()
    {
        var repository = new InMemoryFiscalPeriodRepository();
        repository.Periods.Add(new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) });
        var service = new FiscalPeriodService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RequireOpenPeriodAsync(new DateOnly(2027, 1, 1)));
    }

    [Fact]
    public async Task RequireOpenPeriod_rejects_posting_to_closed_period()
    {
        var repository = new InMemoryFiscalPeriodRepository();
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        period.Close("admin");
        repository.Periods.Add(period);
        var service = new FiscalPeriodService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RequireOpenPeriodAsync(new DateOnly(2026, 9, 8)));
    }

    [Fact]
    public async Task RequireOpenPeriod_returns_the_single_open_period_containing_transaction_date()
    {
        var repository = new InMemoryFiscalPeriodRepository();
        var period = new FiscalPeriod { Name = "FY2026", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31) };
        repository.Periods.Add(period);
        var service = new FiscalPeriodService(repository);

        var result = await service.RequireOpenPeriodAsync(new DateOnly(2026, 9, 8));

        Assert.Equal(period.Id, result.Id);
        Assert.Equal("Open", result.Status);
    }

    private sealed class InMemoryFiscalPeriodRepository : IFiscalPeriodRepository
    {
        public List<FiscalPeriod> Periods { get; } = [];

        public Task<IReadOnlyList<FiscalPeriod>> GetFiscalPeriodsAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<FiscalPeriod>>(Periods);

        public Task<FiscalPeriod?> GetFiscalPeriodAsync(Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(Periods.SingleOrDefault(x => x.Id == id));

        public Task<FiscalPeriod?> GetContainingPeriodAsync(DateOnly date, CancellationToken cancellationToken) =>
            Task.FromResult(Periods.SingleOrDefault(x => x.Contains(date)));

        public Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken) =>
            Task.FromResult(Periods.Any(x => string.Equals(x.Name, name, StringComparison.OrdinalIgnoreCase) && x.Id != excludingId));

        public Task<bool> HasOverlappingPeriodAsync(DateOnly startDate, DateOnly endDate, Guid? excludingId, CancellationToken cancellationToken) =>
            Task.FromResult(Periods.Any(x => x.Id != excludingId && x.StartDate <= endDate && startDate <= x.EndDate));

        public Task AddAsync(FiscalPeriod period, CancellationToken cancellationToken)
        {
            Periods.Add(period);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
