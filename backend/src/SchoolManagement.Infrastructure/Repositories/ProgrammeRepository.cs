using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class ProgrammeRepository(SchoolManagementDbContext db) : IProgrammeRepository
{
    public async Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Programmes.AsNoTracking().OrderBy(x => x.Name).ToListAsync(cancellationToken);

    public Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Programmes.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.Programmes.AnyAsync(x => x.Code == code && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);
    
    public Task<bool> DepartmentIsActiveAsync(Guid departmentId, CancellationToken cancellationToken = default) =>
        db.Departments.AnyAsync(x => x.Id == departmentId && x.IsActive, cancellationToken);

    public Task AddAsync(Programme programme, CancellationToken cancellationToken = default) =>
        db.Programmes.AddAsync(programme, cancellationToken).AsTask();

    public Task<bool> HasCurriculaAsync(Guid programmeId, CancellationToken cancellationToken = default) =>
        db.Curricula.AnyAsync(x => x.ProgrammeId == programmeId, cancellationToken);

    public void Remove(Programme programme) => db.Programmes.Remove(programme);

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var programme = await db.Programmes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (programme is not null)
        {
            db.Programmes.Remove(programme);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
