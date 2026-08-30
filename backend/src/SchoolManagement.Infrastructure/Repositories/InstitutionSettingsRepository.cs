using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Administration;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class InstitutionSettingsRepository(SchoolManagementDbContext db) : IInstitutionSettingsRepository
{
    public async Task<IReadOnlyList<InstitutionSettings>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.InstitutionSettings.AsNoTracking().OrderByDescending(x => x.UpdatedAt).ToListAsync(cancellationToken);

    public Task<InstitutionSettings?> GetActiveAsync(CancellationToken cancellationToken = default) =>
        db.InstitutionSettings.AsNoTracking().SingleOrDefaultAsync(x => x.IsActive, cancellationToken);

    public Task<InstitutionSettings?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.InstitutionSettings.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(InstitutionSettings settings, CancellationToken cancellationToken = default) =>
        db.InstitutionSettings.AddAsync(settings, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
