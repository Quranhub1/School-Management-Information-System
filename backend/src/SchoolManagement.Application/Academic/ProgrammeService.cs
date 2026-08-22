using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateProgrammeRequest(
    Guid DepartmentId,
    string Code,
    string Name,
    string Award,
    string? AwardTitle,
    int DurationYears,
    string? DurationUnit,
    string? StudyMode,
    string? DeliveryType,
    string? Regulator,
    string? ApprovalReference,
    DateOnly? ApprovalDate);

public sealed class ProgrammeService(IProgrammeRepository programmes)
{
    public Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default) =>
        programmes.GetAllAsync(cancellationToken);

    public Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        programmes.GetByIdAsync(id, cancellationToken);

    public async Task<(bool Success, string? Error, Programme? Programme)> CreateAsync(
        CreateProgrammeRequest request,
        CancellationToken cancellationToken = default)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var name = request.Name.Trim();
        var award = request.Award.Trim();

        if (request.DepartmentId == Guid.Empty) return (false, "Department is required.", null);
        if (string.IsNullOrWhiteSpace(code)) return (false, "Programme code is required.", null);
        if (string.IsNullOrWhiteSpace(name)) return (false, "Programme name is required.", null);
        if (string.IsNullOrWhiteSpace(award)) return (false, "Award is required.", null);
        if (request.DurationYears < 1) return (false, "Duration must be at least one year.", null);
        if (await programmes.CodeExistsAsync(code, cancellationToken: cancellationToken))
            return (false, $"Programme code '{code}' already exists.", null);

        var programme = new Programme
        {
            DepartmentId = request.DepartmentId,
            Code = code,
            Name = name,
            Award = award,
            AwardTitle = string.IsNullOrWhiteSpace(request.AwardTitle) ? null : request.AwardTitle.Trim(),
            DurationYears = request.DurationYears,
            DurationUnit = string.IsNullOrWhiteSpace(request.DurationUnit) ? "Years" : request.DurationUnit.Trim(),
            StudyMode = string.IsNullOrWhiteSpace(request.StudyMode) ? "Full-time" : request.StudyMode.Trim(),
            DeliveryType = string.IsNullOrWhiteSpace(request.DeliveryType) ? "Academic" : request.DeliveryType.Trim(),
            Regulator = string.IsNullOrWhiteSpace(request.Regulator) ? null : request.Regulator.Trim(),
            ApprovalReference = string.IsNullOrWhiteSpace(request.ApprovalReference) ? null : request.ApprovalReference.Trim(),
            ApprovalDate = request.ApprovalDate,
        };

        await programmes.AddAsync(programme, cancellationToken);
        await programmes.SaveChangesAsync(cancellationToken);
        return (true, null, programme);
    }

    public async Task<bool> SetActiveAsync(Guid id, bool active, CancellationToken cancellationToken = default)
    {
        var programme = await programmes.GetByIdAsync(id, cancellationToken);
        if (programme is null) return false;
        programme.IsActive = active;
        await programmes.SaveChangesAsync(cancellationToken);
        return true;
    }
}
