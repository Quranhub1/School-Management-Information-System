using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class StreamRepository(SchoolManagementDbContext db) : IStreamRepository
{
    public async Task<IReadOnlyList<Stream>> GetByClassAsync(Guid classId, CancellationToken cancellationToken = default) =>
        await db.Streams.AsNoTracking().Where(x => x.AcademicClassId == classId).OrderBy(x => x.Code).ToListAsync(cancellationToken);

    public Task<Stream?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Streams.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(Stream stream, CancellationToken cancellationToken = default) =>
        db.Streams.AddAsync(stream, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
