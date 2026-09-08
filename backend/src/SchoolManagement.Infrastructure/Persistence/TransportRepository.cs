using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Transport;
namespace SchoolManagement.Infrastructure.Persistence;
public sealed class TransportRepository(SchoolManagementDbContext db) : ITransportRepository
{
    public async Task<IReadOnlyList<TransportVehicle>> GetVehiclesAsync(CancellationToken ct = default) => await db.Set<TransportVehicle>().AsNoTracking().ToListAsync(ct);
    public async Task<IReadOnlyList<TransportRoute>> GetRoutesAsync(CancellationToken ct = default) => await db.Set<TransportRoute>().AsNoTracking().ToListAsync(ct);
    public async Task<IReadOnlyList<TransportAssignment>> GetAssignmentsAsync(CancellationToken ct = default) => await db.Set<TransportAssignment>().Include(a => a.Route).Include(a => a.Vehicle).AsNoTracking().ToListAsync(ct);
    public Task<TransportRoute?> GetRouteAsync(Guid id, CancellationToken ct = default) => db.Set<TransportRoute>().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, ct);
    public Task<TransportVehicle?> GetVehicleAsync(Guid id, CancellationToken ct = default) => db.Set<TransportVehicle>().FirstOrDefaultAsync(x => x.Id == id && x.IsActive, ct);
    public Task<TransportAssignment?> GetActiveAssignmentAsync(Guid studentId, CancellationToken ct = default) => db.Set<TransportAssignment>().FirstOrDefaultAsync(x => x.StudentId == studentId && x.Status == "Active", ct);
    public Task AddAsync<T>(T entity, CancellationToken ct = default) where T : class => db.Set<T>().AddAsync(entity, ct).AsTask();
    public Task SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}
