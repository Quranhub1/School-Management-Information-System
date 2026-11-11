using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateProgrammeRequest(
    Guid? DepartmentId,
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
    DateOnly? ApprovalDate,
    ProgrammeType Type = ProgrammeType.FullProgramme);

public sealed class ProgrammeService(IProgrammeRepository programmes, IAcademicAuthorityRepository authorities)
{
    public Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken cancellationToken = default) =>
        programmes.GetAllAsync(cancellationToken);

    public Task<Programme?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        programmes.GetByIdAsync(id, cancellationToken);

    private async Task<(string? Code, string? Error)> ValidateAsync(CreateProgrammeRequest request, Guid? excludingId, CancellationToken cancellationToken)
    {
        var code = request.Code?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code)) return (null, "Programme code is required.");
        if (string.IsNullOrWhiteSpace(request.Name)) return (null, "Programme name is required.");
        if (string.IsNullOrWhiteSpace(request.Award)) return (null, "Award is required.");
        if (request.DurationYears < 0) return (null, "Duration cannot be negative.");
        if (request.DepartmentId == Guid.Empty) return (null, "Department selection is invalid.");
        if (await programmes.CodeExistsAsync(code, excludingId, cancellationToken))
            return (null, $"Programme code '{code}' already exists.");

        var authorityCode = NormalizeAuthorityCode(request.Regulator);
        var authority = await authorities.GetByCodeAsync(authorityCode, cancellationToken);
        if (authority is null || !authority.IsActive)
            return (null, "Select an active academic authority from the authority register.");
        return (authorityCode, null);
    }

    private static string NormalizeAuthorityCode(string? value)
    {
        var code = (value ?? "SCHOOL_BASED").Trim().ToUpperInvariant().Replace('-', '_').Replace(' ', '_');
        return code is "SCHOOL" or "SCHOOLBASED" ? "SCHOOL_BASED" : code;
    }

    public async Task<(bool Success, string? Error, Programme? Programme)> CreateAsync(
        CreateProgrammeRequest request, CancellationToken cancellationToken = default)
    {
        var validation = await ValidateAsync(request, null, cancellationToken);
        if (validation.Error is not null) return (false, validation.Error, null);
        var programme = new Programme
        {
            DepartmentId = request.DepartmentId,
            Code = request.Code.Trim().ToUpperInvariant(),
            Name = request.Name.Trim(),
            Award = request.Award.Trim(),
            AwardTitle = string.IsNullOrWhiteSpace(request.AwardTitle) ? null : request.AwardTitle.Trim(),
            DurationYears = request.DurationYears,
            DurationUnit = string.IsNullOrWhiteSpace(request.DurationUnit) ? "Years" : request.DurationUnit.Trim(),
            StudyMode = string.IsNullOrWhiteSpace(request.StudyMode) ? "Full-time" : request.StudyMode.Trim(),
            DeliveryType = string.IsNullOrWhiteSpace(request.DeliveryType) ? "Academic" : request.DeliveryType.Trim(),
            Type = request.Type,
            Regulator = validation.Code,
            ApprovalReference = string.IsNullOrWhiteSpace(request.ApprovalReference) ? null : request.ApprovalReference.Trim(),
            ApprovalDate = request.ApprovalDate,
        };
        await programmes.AddAsync(programme, cancellationToken);
        await programmes.SaveChangesAsync(cancellationToken);
        return (true, null, programme);
    }

    public async Task<(bool Success, string? Error, Programme? Programme)> UpdateAsync(
        Guid id, CreateProgrammeRequest request, CancellationToken cancellationToken = default)
    {
        var programme = await programmes.GetByIdAsync(id, cancellationToken);
        if (programme is null) return (false, "Programme was not found.", null);
        var validation = await ValidateAsync(request, id, cancellationToken);
        if (validation.Error is not null) return (false, validation.Error, null);
        programme.DepartmentId = request.DepartmentId;
        programme.Code = request.Code.Trim().ToUpperInvariant();
        programme.Name = request.Name.Trim();
        programme.Award = request.Award.Trim();
        programme.AwardTitle = string.IsNullOrWhiteSpace(request.AwardTitle) ? null : request.AwardTitle.Trim();
        programme.DurationYears = request.DurationYears;
        programme.DurationUnit = string.IsNullOrWhiteSpace(request.DurationUnit) ? "Years" : request.DurationUnit.Trim();
        programme.StudyMode = string.IsNullOrWhiteSpace(request.StudyMode) ? "Full-time" : request.StudyMode.Trim();
        programme.DeliveryType = string.IsNullOrWhiteSpace(request.DeliveryType) ? "Academic" : request.DeliveryType.Trim();
        programme.Type = request.Type;
        programme.Regulator = validation.Code;
        programme.ApprovalReference = string.IsNullOrWhiteSpace(request.ApprovalReference) ? null : request.ApprovalReference.Trim();
        programme.ApprovalDate = request.ApprovalDate;
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
