using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed class ProgrammeService(IProgrammeRepository programmes)
{
    public Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default) =>
        programmes.GetAllAsync(cancellationToken);

    public Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        programmes.GetByIdAsync(id, cancellationToken);
}
