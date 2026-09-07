using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateStreamRequest(Guid AcademicClassId, string Code, string? Name, int? Capacity);

public sealed class StreamService(IStreamRepository streams)
{
    public Task<IReadOnlyList<SchoolManagement.Domain.Academic.Stream>> GetByClassAsync(Guid classId, CancellationToken ct = default)
        => streams.GetByClassAsync(classId, ct);

    public async Task<(bool Success, string? Error, SchoolManagement.Domain.Academic.Stream? Stream)> CreateAsync(CreateStreamRequest request, CancellationToken ct = default)
    {
        var code = request.Code.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Stream code is required.", null);

        var stream = new SchoolManagement.Domain.Academic.Stream { AcademicClassId = request.AcademicClassId, Code = code, Name = request.Name?.Trim(), Capacity = request.Capacity };
        await streams.AddAsync(stream, ct);
        await streams.SaveChangesAsync(ct);
        return (true, null, stream);
    }
}
