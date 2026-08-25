using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateAcademicClassRequest(Guid ProgrammeId, Guid AcademicPeriodId, string Code, string? Name, int YearOfStudy, int? MaxEnrolment);
public sealed record UpdateAcademicClassRequest(Guid Id, string Code, string? Name, int YearOfStudy, int? MaxEnrolment, ClassStatus Status);

public sealed class AcademicClassService(IAcademicClassRepository classes)
{
    public Task<IReadOnlyList<AcademicClass>> GetByProgrammeAsync(Guid programmeId, CancellationToken ct = default)
        => classes.GetByProgrammeAsync(programmeId, ct);

    public Task<IReadOnlyList<AcademicClass>> GetByPeriodAsync(Guid periodId, CancellationToken ct = default)
        => classes.GetByPeriodAsync(periodId, ct);

    public async Task<(bool Success, string? Error, AcademicClass? Class)> CreateAsync(CreateAcademicClassRequest request, CancellationToken ct = default)
    {
        var code = request.Code.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Class code is required.", null);
        if (request.YearOfStudy < 1) return (false, "Year of study must be at least 1.", null);
        if (await classes.CodeExistsAsync(request.ProgrammeId, request.AcademicPeriodId, code, cancellationToken: ct))
            return (false, "A class with this code already exists for the selected programme and period.", null);

        var academicClass = new AcademicClass
        {
            ProgrammeId = request.ProgrammeId,
            AcademicPeriodId = request.AcademicPeriodId,
            Code = code,
            Name = request.Name?.Trim(),
            YearOfStudy = request.YearOfStudy,
            MaxEnrolment = request.MaxEnrolment
        };
        await classes.AddAsync(academicClass, ct);
        await classes.SaveChangesAsync(ct);
        return (true, null, academicClass);
    }

    public async Task<(bool Success, string? Error)> UpdateAsync(UpdateAcademicClassRequest request, CancellationToken ct = default)
    {
        var existing = await classes.GetByIdAsync(request.Id, ct);
        if (existing is null) return (false, "Class not found.");
        if (await classes.CodeExistsAsync(existing.ProgrammeId, existing.AcademicPeriodId, request.Code.Trim(), request.Id, ct))
            return (false, "A class with this code already exists.");
        return (true, null);
    }
}
