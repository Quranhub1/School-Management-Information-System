using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Hostel;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class HostelRepository(SchoolManagementDbContext db) : IHostelRepository
{
    public async Task<IReadOnlyList<Hostel>> GetHostelsAsync(CancellationToken cancellationToken = default) =>
        await db.Set<Hostel>().Include(h => h.Rooms).ThenInclude(r => r.Beds).ThenInclude(b => b.Allocations).AsSplitQuery().AsNoTracking().ToListAsync(cancellationToken);

    public Task<Hostel?> GetHostelAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<Hostel>().Include(h => h.Rooms).ThenInclude(r => r.Beds).FirstOrDefaultAsync(h => h.Id == id, cancellationToken);

    public Task<HostelRoom?> GetRoomAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<HostelRoom>().Include(r => r.Beds).FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

    public Task<HostelBed?> GetBedAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<HostelBed>().FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

    public Task<HostelAllocation?> GetAllocationAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<HostelAllocation>().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

    public Task<HostelAllocation?> GetActiveAllocationByBedAsync(Guid bedId, CancellationToken cancellationToken = default) =>
        db.Set<HostelAllocation>().FirstOrDefaultAsync(a => a.BedId == bedId && a.Status == "Active", cancellationToken);

    public Task<HostelAllocation?> GetActiveAllocationByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        db.Set<HostelAllocation>().FirstOrDefaultAsync(a => a.StudentId == studentId && a.Status == "Active", cancellationToken);

    public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class => db.Set<T>().AddAsync(entity, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
