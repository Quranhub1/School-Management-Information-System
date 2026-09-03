using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/search")]
[Authorize]
public sealed class GlobalSearchController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<GlobalSearchResponse>> Search([FromQuery] string? q, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
            return Ok(new GlobalSearchResponse { Query = q ?? string.Empty, Students = [], Staff = [], Courses = [], Programmes = [], AcademicYears = [], Semesters = [], TeachingGroups = [], Applicants = [], Alumni = [] });

        var term = q.Trim().ToLower();
        var students = await SearchStudents(term, ct);
        var staff = await SearchStaff(term, ct);
        var courses = await SearchCourses(term, ct);
        var programmes = await SearchProgrammes(term, ct);
        var academicYears = await SearchAcademicYears(term, ct);
        var semesters = await SearchSemesters(term, ct);
        var teachingGroups = await SearchTeachingGroups(term, ct);
        var applicants = await SearchApplicants(term, ct);
        var alumni = await SearchAlumni(term, ct);

        return Ok(new GlobalSearchResponse
        {
            Query = q.Trim(),
            Students = students,
            Staff = staff,
            Courses = courses,
            Programmes = programmes,
            AcademicYears = academicYears,
            Semesters = semesters,
            TeachingGroups = teachingGroups,
            Applicants = applicants,
            Alumni = alumni
        });
    }

    private async Task<IReadOnlyList<StudentSearchResult>> SearchStudents(string term, CancellationToken ct)
    {
        return await db.Students.AsNoTracking()
            .Where(x => x.StudentNumber.ToLower().Contains(term)
                     || x.FirstName.ToLower().Contains(term)
                     || x.LastName.ToLower().Contains(term)
                     || (x.OtherNames != null && x.OtherNames.ToLower().Contains(term))
                     || (x.NationalId != null && x.NationalId.ToLower().Contains(term))
                     || (x.Email != null && x.Email.ToLower().Contains(term))
                     || (x.PhoneNumber != null && x.PhoneNumber.ToLower().Contains(term)))
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Select(x => new StudentSearchResult(x.Id, x.StudentNumber, $"{x.FirstName} {x.LastName}".Trim(), x.Status))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<StaffSearchResult>> SearchStaff(string term, CancellationToken ct)
    {
        return await db.StaffMembers.AsNoTracking()
            .Where(x => x.StaffNumber.ToLower().Contains(term)
                     || x.FirstName.ToLower().Contains(term)
                     || x.LastName.ToLower().Contains(term)
                     || (x.NationalId != null && x.NationalId.ToLower().Contains(term))
                     || (x.Email != null && x.Email.ToLower().Contains(term))
                     || (x.PhoneNumber != null && x.PhoneNumber.ToLower().Contains(term)))
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Select(x => new StaffSearchResult(x.Id, x.StaffNumber, $"{x.FirstName} {x.LastName}".Trim(), x.EmploymentType))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<CourseSearchResult>> SearchCourses(string term, CancellationToken ct)
    {
        return await db.Courses.AsNoTracking()
            .Where(x => x.Code.ToLower().Contains(term) || x.Name.ToLower().Contains(term))
            .OrderBy(x => x.Code)
            .Select(x => new CourseSearchResult(x.Id, x.Code, x.Name, x.CreditUnits))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<ProgrammeSearchResult>> SearchProgrammes(string term, CancellationToken ct)
    {
        return await db.Programmes.AsNoTracking()
            .Where(x => x.Code.ToLower().Contains(term) || x.Name.ToLower().Contains(term) || x.Award.ToLower().Contains(term))
            .OrderBy(x => x.Code)
            .Select(x => new ProgrammeSearchResult(x.Id, x.Code, x.Name, x.Award))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<AcademicYearSearchResult>> SearchAcademicYears(string term, CancellationToken ct)
    {
        return await db.AcademicYears.AsNoTracking()
            .Where(x => x.Name.ToLower().Contains(term))
            .OrderByDescending(x => x.StartDate)
            .Select(x => new AcademicYearSearchResult(x.Id, x.Name, x.StartDate, x.EndDate, x.IsCurrent))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<SemesterSearchResult>> SearchSemesters(string term, CancellationToken ct)
    {
        return await db.Semesters.AsNoTracking()
            .Where(x => x.Name.ToLower().Contains(term))
            .OrderByDescending(x => x.StartDate)
            .Select(x => new SemesterSearchResult(x.Id, x.Name, x.Sequence, x.StartDate, x.EndDate, x.AcademicYearId))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<TeachingGroupSearchResult>> SearchTeachingGroups(string term, CancellationToken ct)
    {
        return await db.TeachingGroups.AsNoTracking()
            .Where(x => x.GroupCode.ToLower().Contains(term) || (x.Name != null && x.Name.ToLower().Contains(term)))
            .OrderBy(x => x.GroupCode)
            .Select(x => new TeachingGroupSearchResult(x.Id, x.GroupCode, x.Name, x.CourseOfferingId))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<ApplicantSearchResult>> SearchApplicants(string term, CancellationToken ct)
    {
        return await db.Applicants.AsNoTracking()
            .Where(x => x.ApplicationNumber.ToLower().Contains(term)
                     || x.FirstName.ToLower().Contains(term)
                     || x.LastName.ToLower().Contains(term)
                     || (x.OtherNames != null && x.OtherNames.ToLower().Contains(term))
                     || (x.NationalId != null && x.NationalId.ToLower().Contains(term)))
            .OrderByDescending(x => x.AppliedAt)
            .Select(x => new ApplicantSearchResult(x.Id, x.ApplicationNumber, $"{x.FirstName} {x.LastName}".Trim(), x.Status))
            .Take(20).ToListAsync(ct);
    }

    private async Task<IReadOnlyList<AlumniSearchResult>> SearchAlumni(string term, CancellationToken ct)
    {
        return await db.Alumni.AsNoTracking()
            .Where(x => x.FirstName.ToLower().Contains(term) || x.LastName.ToLower().Contains(term) || (x.OtherNames != null && x.OtherNames.ToLower().Contains(term)))
            .OrderByDescending(x => x.GraduationDate)
            .Select(x => new AlumniSearchResult(x.Id, x.StudentId, $"{x.FirstName} {x.LastName}".Trim(), x.GraduationDate))
            .Take(20).ToListAsync(ct);
    }
}

public sealed record GlobalSearchResponse
{
    public required string Query { get; init; }
    public IReadOnlyList<StudentSearchResult> Students { get; init; } = [];
    public IReadOnlyList<StaffSearchResult> Staff { get; init; } = [];
    public IReadOnlyList<CourseSearchResult> Courses { get; init; } = [];
    public IReadOnlyList<ProgrammeSearchResult> Programmes { get; init; } = [];
    public IReadOnlyList<AcademicYearSearchResult> AcademicYears { get; init; } = [];
    public IReadOnlyList<SemesterSearchResult> Semesters { get; init; } = [];
    public IReadOnlyList<TeachingGroupSearchResult> TeachingGroups { get; init; } = [];
    public IReadOnlyList<ApplicantSearchResult> Applicants { get; init; } = [];
    public IReadOnlyList<AlumniSearchResult> Alumni { get; init; } = [];
}

public sealed record StudentSearchResult(string Id, string StudentNumber, string FullName, string Status);
public sealed record StaffSearchResult(string Id, string StaffNumber, string FullName, string EmploymentType);
public sealed record CourseSearchResult(string Id, string Code, string Name, int CreditUnits);
public sealed record ProgrammeSearchResult(string Id, string Code, string Name, string Award);
public sealed record AcademicYearSearchResult(string Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent);
public sealed record SemesterSearchResult(string Id, string Name, int Sequence, DateOnly StartDate, DateOnly EndDate, Guid AcademicYearId);
public sealed record TeachingGroupSearchResult(string Id, string GroupCode, string? Name, Guid CourseOfferingId);
public sealed record ApplicantSearchResult(string Id, string ApplicationNumber, string FullName, string Status);
public sealed record AlumniSearchResult(string Id, Guid StudentId, string FullName, DateOnly GraduationDate);
