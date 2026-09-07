using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class FiscalPeriodRepository(SchoolManagementDbContext db) : IFiscalPeriodRepository
{
    public async Task<IReadOnlyList<FiscalPeriod>> GetFiscalPeriodsAsync(CancellationToken cancellationToken) =>
        await db.FiscalPeriods.AsNoTracking().OrderByDescending(x => x.StartDate).ToListAsync(cancellationToken);

    public Task<FiscalPeriod?> GetFiscalPeriodAsync(Guid id, CancellationToken cancellationToken) =>
        db.FiscalPeriods.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<FiscalPeriod?> GetContainingPeriodAsync(DateOnly date, CancellationToken cancellationToken) =>
        db.FiscalPeriods.AsNoTracking().SingleOrDefaultAsync(x => x.StartDate <= date && x.EndDate >= date, cancellationToken);

    public Task<bool> NameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken) =>
        db.FiscalPeriods.AnyAsync(x => x.Name == name && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task<bool> HasOverlappingPeriodAsync(DateOnly startDate, DateOnly endDate, Guid? excludingId, CancellationToken cancellationToken) =>
        db.FiscalPeriods.AnyAsync(x => x.StartDate <= endDate && x.EndDate >= startDate && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task AddAsync(FiscalPeriod period, CancellationToken cancellationToken) => db.FiscalPeriods.AddAsync(period, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
