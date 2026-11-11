using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AcademicAuthorityRepository(SchoolManagementDbContext db) : IAcademicAuthorityRepository
{
    public async Task<IReadOnlyList<AcademicAuthority>> GetAllAsync(bool includeInactive = false, CancellationToken cancellationToken = default) =>
        await db.AcademicAuthorities.AsNoTracking().Where(x => includeInactive || x.IsActive).OrderBy(x => x.SortOrder).ThenBy(x => x.Name).ToListAsync(cancellationToken);

    public Task<AcademicAuthority?> GetByCodeAsync(string code, CancellationToken cancellationToken = default) =>
        db.AcademicAuthorities.SingleOrDefaultAsync(x => x.Code == code, cancellationToken);

    public Task<bool> CodeExistsAsync(string code, CancellationToken cancellationToken = default) =>
        db.AcademicAuthorities.AnyAsync(x => x.Code == code, cancellationToken);

    public Task AddAsync(AcademicAuthority authority, CancellationToken cancellationToken = default) =>
        db.AcademicAuthorities.AddAsync(authority, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
