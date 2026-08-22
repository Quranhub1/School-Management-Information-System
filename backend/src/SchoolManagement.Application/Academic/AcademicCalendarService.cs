using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateAcademicYearRequest(string Name, DateOnly StartDate, DateOnly EndDate);
public sealed record CreateSemesterRequest(Guid AcademicYearId, string Name, int Sequence, DateOnly StartDate, DateOnly EndDate);

public sealed class AcademicCalendarService(IAcademicYearRepository years, ISemesterRepository semesters)
{
    public Task<IReadOnlyList<AcademicYear>> GetYearsAsync(CancellationToken cancellationToken = default) => years.GetAllAsync(cancellationToken);

    public Task<IReadOnlyList<Semester>> GetSemestersAsync(Guid academicYearId, CancellationToken cancellationToken = default) =>
        semesters.GetByAcademicYearAsync(academicYearId, cancellationToken);

    public async Task<(bool Success, string? Error, AcademicYear? Year)> CreateYearAsync(CreateAcademicYearRequest request, CancellationToken cancellationToken = default)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return (false, "Academic year name is required.", null);
        if (request.StartDate >= request.EndDate) return (false, "Academic year start date must be before its end date.", null);
        if (await years.NameExistsAsync(name, cancellationToken: cancellationToken)) return (false, $"Academic year '{name}' already exists.", null);

        var year = new AcademicYear { Name = name, StartDate = request.StartDate, EndDate = request.EndDate };
        await years.AddAsync(year, cancellationToken);
        await years.SaveChangesAsync(cancellationToken);
        return (true, null, year);
    }

    public async Task<(bool Success, string? Error)> SetCurrentYearAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(id, cancellationToken: cancellationToken);
        if (year is null) return (false, "Academic year was not found.");
        if (!year.IsActive) return (false, "An inactive academic year cannot be made current.");
        await years.SetCurrentAsync(id, cancellationToken);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, Semester? Semester)> CreateSemesterAsync(CreateSemesterRequest request, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(request.AcademicYearId, cancellationToken: cancellationToken);
        if (year is null) return (false, "Academic year was not found.", null);
        if (request.StartDate >= request.EndDate) return (false, "Period start date must be before its end date.", null);
        if (request.StartDate < year.StartDate || request.EndDate > year.EndDate) return (false, "Period dates must fall within the academic year.", null);
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return (false, "Period name is required.", null);
        if (request.Sequence < 1) return (false, "Period sequence must be at least 1.", null);
        if (await semesters.NameOrSequenceExistsAsync(request.AcademicYearId, name, request.Sequence, cancellationToken: cancellationToken)) return (false, "A period with that name or sequence already exists.", null);
        if (await semesters.OverlapsAsync(request.AcademicYearId, request.StartDate, request.EndDate, cancellationToken: cancellationToken)) return (false, "Period dates overlap an existing period.", null);

        var semester = new Semester { AcademicYearId = request.AcademicYearId, Name = name, Sequence = request.Sequence, StartDate = request.StartDate, EndDate = request.EndDate };
        await semesters.AddAsync(semester, cancellationToken);
        await semesters.SaveChangesAsync(cancellationToken);
        return (true, null, semester);
    }

    public async Task<(bool Success, string? Error)> SetCurrentSemesterAsync(Guid academicYearId, Guid semesterId, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(academicYearId, cancellationToken: cancellationToken);
        if (year is null) return (false, "Academic year was not found.");
        var semester = await semesters.GetByIdAsync(semesterId, cancellationToken: cancellationToken);
        if (semester is null || semester.AcademicYearId != academicYearId) return (false, "Academic period was not found.");
        if (!semester.IsActive) return (false, "An inactive academic period cannot be made current.");
        await semesters.SetCurrentAsync(academicYearId, semesterId, cancellationToken);
        return (true, null);
    }
}
