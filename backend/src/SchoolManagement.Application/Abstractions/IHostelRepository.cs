using HostelEntity = SchoolManagement.Domain.Hostel.Hostel;
using SchoolManagement.Domain.Hostel;

namespace SchoolManagement.Application.Abstractions;

public interface IHostelRepository
{
    Task<IReadOnlyList<HostelEntity>> GetHostelsAsync(CancellationToken cancellationToken = default);
    Task<HostelEntity?> GetHostelAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HostelRoom?> GetRoomAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HostelBed?> GetBedAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HostelAllocation?> GetAllocationAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HostelAllocation?> GetActiveAllocationByBedAsync(Guid bedId, CancellationToken cancellationToken = default);
    Task<HostelAllocation?> GetActiveAllocationByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class;
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
