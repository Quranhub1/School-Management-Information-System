using SchoolManagement.Domain.Access;

namespace SchoolManagement.Application.Access;

public interface IGateLogRepository
{
    Task<IReadOnlyList<GateLog>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<GateLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<GateLog>> SearchAsync(string? personName = null, string? personType = null, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default);
    Task AddAsync(GateLog gateLog, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
