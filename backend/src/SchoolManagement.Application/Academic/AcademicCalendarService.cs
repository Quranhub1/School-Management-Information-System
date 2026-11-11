using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateAcademicYearRequest(string Name, DateOnly StartDate, DateOnly EndDate);
public sealed record UpdateAcademicYearRequest(string Name, DateOnly StartDate, DateOnly EndDate);
public sealed record CreateSemesterRequest(Guid AcademicYearId, string Name, int Sequence, DateOnly StartDate, DateOnly EndDate);
public sealed record UpdateSemesterRequest(string Name, int Sequence, DateOnly StartDate, DateOnly EndDate);

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

    public async Task<(bool Success, string? Error)> UpdateYearAsync(Guid id, UpdateAcademicYearRequest request, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(id, tracked: true, cancellationToken: cancellationToken);
        if (year is null) return (false, "Academic year was not found.");
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return (false, "Academic year name is required.");
        if (request.StartDate >= request.EndDate) return (false, "Academic year start date must be before its end date.");
        if (await years.NameExistsAsync(name, id, cancellationToken)) return (false, $"Academic year '{name}' already exists.");
        var periods = await semesters.GetByAcademicYearAsync(id, cancellationToken);
        if (periods.Any(period => period.StartDate < request.StartDate || period.EndDate > request.EndDate))
            return (false, "The updated year dates must continue to contain all existing academic periods.");
        year.Name = name; year.StartDate = request.StartDate; year.EndDate = request.EndDate;
        await years.SaveChangesAsync(cancellationToken);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SetYearActiveAsync(Guid id, bool isActive, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(id, tracked: true, cancellationToken);
        if (year is null) return (false, "Academic year was not found.");
        var periods = await semesters.GetByAcademicYearAsync(id, cancellationToken);
        if (!isActive && periods.Any(period => period.IsCurrent))
            return (false, "Select another current academic period before deactivating this academic year.");
        year.IsActive = isActive;
        if (!isActive) year.IsCurrent = false;
        await years.SaveChangesAsync(cancellationToken);
        return (true, null);
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

    public async Task<(bool Success, string? Error)> UpdateSemesterAsync(Guid academicYearId, Guid semesterId, UpdateSemesterRequest request, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(academicYearId, cancellationToken: cancellationToken);
        if (year is null) return (false, "Academic year was not found.");
        var semester = await semesters.GetByIdAsync(semesterId, tracked: true, cancellationToken: cancellationToken);
        if (semester is null || semester.AcademicYearId != academicYearId) return (false, "Academic period was not found.");
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name)) return (false, "Period name is required.");
        if (request.Sequence < 1) return (false, "Period sequence must be at least 1.");
        if (request.StartDate >= request.EndDate || request.StartDate < year.StartDate || request.EndDate > year.EndDate)
            return (false, "Period dates must fall within the academic year and start before they end.");
        if (await semesters.NameOrSequenceExistsAsync(academicYearId, name, request.Sequence, semesterId, cancellationToken))
            return (false, "A period with that name or sequence already exists.");
        if (await semesters.OverlapsAsync(academicYearId, request.StartDate, request.EndDate, semesterId, cancellationToken))
            return (false, "Period dates overlap an existing period.");
        semester.Name = name; semester.Sequence = request.Sequence; semester.StartDate = request.StartDate; semester.EndDate = request.EndDate;
        await semesters.SaveChangesAsync(cancellationToken);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SetPeriodActiveAsync(Guid academicYearId, Guid semesterId, bool isActive, CancellationToken cancellationToken = default)
    {
        var semester = await semesters.GetByIdAsync(semesterId, tracked: true, cancellationToken);
        if (semester is null || semester.AcademicYearId != academicYearId) return (false, "Academic period was not found.");
        if (!isActive && semester.IsCurrent) return (false, "Select another current academic period before deactivating this period.");
        semester.IsActive = isActive;
        await semesters.SaveChangesAsync(cancellationToken);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SetCurrentSemesterAsync(Guid academicYearId, Guid semesterId, CancellationToken cancellationToken = default)
    {
        var year = await years.GetByIdAsync(academicYearId, cancellationToken: cancellationToken);
        if (year is null) return (false, "Academic year was not found.");
        if (!year.IsActive) return (false, "An inactive academic year cannot have a current period.");
        var semester = await semesters.GetByIdAsync(semesterId, cancellationToken: cancellationToken);
        if (semester is null || semester.AcademicYearId != academicYearId) return (false, "Academic period was not found.");
        if (!semester.IsActive) return (false, "An inactive academic period cannot be made current.");
        await years.SetCurrentAsync(academicYearId, cancellationToken);
        await semesters.SetCurrentAsync(academicYearId, semesterId, cancellationToken);
        return (true, null);
    }
}
