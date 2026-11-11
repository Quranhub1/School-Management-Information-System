using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateSubjectRequest(Guid ProgrammeId, Guid CourseId, int YearOfStudy, int? PeriodSequence, bool IsCompulsory, string? ElectiveGroup);
public sealed record UpdateSubjectRequest(Guid CourseId, int YearOfStudy, int? PeriodSequence, bool IsCompulsory, string? ElectiveGroup, bool IsActive);

public sealed class SubjectService(ISubjectRepository subjects)
{
    public Task<IReadOnlyList<Subject>> GetByProgrammeAsync(Guid programmeId, CancellationToken ct = default)
        => subjects.GetByProgrammeAsync(programmeId, ct);

    public Task<IReadOnlyList<Subject>> GetByProgrammeAndYearAsync(Guid programmeId, int yearOfStudy, CancellationToken ct = default)
        => subjects.GetByProgrammeAndYearAsync(programmeId, yearOfStudy, ct);

    public async Task<(bool Success, string? Error)> UpdateAsync(Guid id, UpdateSubjectRequest request, CancellationToken ct = default)
    {
        var existing = await subjects.GetByIdAsync(id, ct);
        if (existing is null) return (false, "Subject not found.");
        if (request.CourseId == Guid.Empty) return (false, "A valid course is required.");
        if (request.YearOfStudy < 1) return (false, "Year of study must be at least 1.");
        if (request.PeriodSequence is < 1) return (false, "Period sequence must be at least 1.");
        if (await subjects.CourseExistsAsync(existing.ProgrammeId, request.CourseId, id, ct))
            return (false, "This course is already assigned to the programme.");
        existing.CourseId = request.CourseId;
        existing.YearOfStudy = request.YearOfStudy;
        existing.PeriodSequence = request.PeriodSequence;
        existing.IsCompulsory = request.IsCompulsory;
        existing.ElectiveGroup = request.ElectiveGroup?.Trim();
        existing.IsActive = request.IsActive;
        await subjects.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, Subject? Subject)> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default)
    {
        if (request.ProgrammeId == Guid.Empty || request.CourseId == Guid.Empty) return (false, "A valid programme and course are required.", null);
        if (request.YearOfStudy < 1) return (false, "Year of study must be at least 1.", null);
        if (request.PeriodSequence is < 1) return (false, "Period sequence must be at least 1.", null);
        if (await subjects.CourseExistsAsync(request.ProgrammeId, request.CourseId, cancellationToken: ct))
            return (false, "This course is already assigned to the programme.", null);

        var subject = new Subject
        {
            ProgrammeId = request.ProgrammeId,
            CourseId = request.CourseId,
            YearOfStudy = request.YearOfStudy,
            PeriodSequence = request.PeriodSequence,
            IsCompulsory = request.IsCompulsory,
            ElectiveGroup = request.ElectiveGroup?.Trim()
        };
        await subjects.AddAsync(subject, ct);
        await subjects.SaveChangesAsync(ct);
        return (true, null, subject);
    }
}
