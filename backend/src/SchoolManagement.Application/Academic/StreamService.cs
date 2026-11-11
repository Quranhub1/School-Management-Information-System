using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateStreamRequest(Guid AcademicClassId, string Code, string? Name);
public sealed record UpdateStreamRequest(string Code, string? Name, bool IsActive);

public sealed class StreamService(IStreamRepository streams)
{
    public Task<IReadOnlyList<SchoolManagement.Domain.Academic.Stream>> GetByClassAsync(Guid classId, CancellationToken ct = default)
        => streams.GetByClassAsync(classId, ct);

    public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateStreamRequest request, CancellationToken ct = default)
    {
        var existing = await streams.GetByIdAsync(id, ct);
        if (existing is null) return (false, "Stream not found.");
        var code = request.Code.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Stream code is required.");
        existing.Code = code;
        existing.Name = string.IsNullOrWhiteSpace(request.Name) ? code : request.Name.Trim();
        existing.IsActive = request.IsActive;
        await streams.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, SchoolManagement.Domain.Academic.Stream? Stream)> CreateAsync(CreateStreamRequest request, CancellationToken ct = default)
    {
        var code = request.Code.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Stream code is required.", null);

        var stream = new SchoolManagement.Domain.Academic.Stream
        {
            AcademicClassId = request.AcademicClassId,
            ClassFormId = request.AcademicClassId.ToString(),
            Code = code,
            Name = string.IsNullOrWhiteSpace(request.Name) ? code : request.Name.Trim()
        };
        await streams.AddAsync(stream, ct);
        await streams.SaveChangesAsync(ct);
        return (true, null, stream);
    }
}
