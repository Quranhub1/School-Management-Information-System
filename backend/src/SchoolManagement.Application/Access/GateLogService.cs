using SchoolManagement.Domain.Access;

namespace SchoolManagement.Application.Access;

public sealed class GateLogService(IGateLogRepository gateLogRepository)
{
    public async Task<IReadOnlyList<GateLog>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await gateLogRepository.GetActiveAsync(cancellationToken);

    public async Task<GateLog?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await gateLogRepository.GetByIdAsync(id, cancellationToken);

    public async Task<IReadOnlyList<GateLog>> SearchAsync(string? personName = null, string? personType = null, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default) =>
        await gateLogRepository.SearchAsync(personName, personType, from, to, cancellationToken);

    public async Task<GateLog> LogEntryAsync(string personName, string personType, string purpose, Guid? issuedBy, string? notes, CancellationToken cancellationToken = default)
    {
        var gateLog = new GateLog
        {
            PersonName = personName,
            PersonType = personType,
            Purpose = purpose,
            EntryTime = DateTimeOffset.UtcNow,
            IssuedBy = issuedBy,
            Notes = notes
        };
        await gateLogRepository.AddAsync(gateLog, cancellationToken);
        await gateLogRepository.SaveChangesAsync(cancellationToken);
        return gateLog;
    }

    public async Task<GateLog?> LogExitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var gateLog = await gateLogRepository.GetByIdAsync(id, cancellationToken);
        if (gateLog is null) return null;
        gateLog.ExitTime = DateTimeOffset.UtcNow;
        await gateLogRepository.SaveChangesAsync(cancellationToken);
        return gateLog;
    }
}
