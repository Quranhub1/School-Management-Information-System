using SchoolManagement.Domain.Transport;
namespace SchoolManagement.Application.Abstractions;
public interface ITransportRepository
{
    Task<IReadOnlyList<TransportVehicle>> GetVehiclesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TransportRoute>> GetRoutesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TransportAssignment>> GetAssignmentsAsync(CancellationToken cancellationToken = default);
    Task<TransportRoute?> GetRouteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TransportVehicle?> GetVehicleAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TransportAssignment?> GetActiveAssignmentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class;
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
