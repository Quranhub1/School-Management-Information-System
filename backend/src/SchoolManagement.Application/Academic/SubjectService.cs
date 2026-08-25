using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateSubjectRequest(Guid ProgrammeId, Guid CourseId, int YearOfStudy, int? PeriodSequence, bool IsCompulsory, string? ElectiveGroup);

public sealed class SubjectService(ISubjectRepository subjects)
{
    public Task<IReadOnlyList<Subject>> GetByProgrammeAsync(Guid programmeId, CancellationToken ct = default)
        => subjects.GetByProgrammeAsync(programmeId, ct);

    public Task<IReadOnlyList<Subject>> GetByProgrammeAndYearAsync(Guid programmeId, int yearOfStudy, CancellationToken ct = default)
        => subjects.GetByProgrammeAndYearAsync(programmeId, yearOfStudy, ct);

    public async Task<(bool Success, string? Error, Subject? Subject)> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default)
    {
        if (request.YearOfStudy < 1) return (false, "Year of study must be at least 1.", null);
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
