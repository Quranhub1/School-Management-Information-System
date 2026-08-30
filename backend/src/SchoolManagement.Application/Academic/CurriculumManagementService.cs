using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateCurriculumRequest(Guid ProgrammeId, string Version, string Title, int MinimumCredits, DateOnly EffectiveFrom, DateOnly? EffectiveTo, ProgrammeType ProgrammeType = ProgrammeType.FullProgramme);
public sealed record CreateCourseRequest(string Code, string Name, int CreditUnits, string? Description, string? CourseType);
public sealed record AddCurriculumCourseRequest(Guid CourseId, int YearOfStudy, int SemesterNumber, bool IsCore);

public sealed class CurriculumManagementService(
    ICurriculumRepository curricula,
    ICourseRepository courses,
    ICurriculumCourseRepository mappings)
{
    public Task<IReadOnlyList<Curriculum>> GetCurriculaAsync(CancellationToken ct = default) => curricula.GetAllAsync(ct);
    public Task<IReadOnlyList<Course>> GetCoursesAsync(CancellationToken ct = default) => courses.GetAllAsync(ct);
    public Task<IReadOnlyList<CurriculumCourse>> GetMappingsAsync(Guid curriculumId, CancellationToken ct = default) => mappings.GetByCurriculumAsync(curriculumId, ct);

    public async Task<(bool Success, string? Error, Curriculum? Curriculum)> CreateCurriculumAsync(CreateCurriculumRequest request, CancellationToken ct = default)
    {
        var version = request.Version.Trim();
        var title = request.Title.Trim();
        if (request.ProgrammeId == Guid.Empty) return (false, "Programme is required.", null);
        if (string.IsNullOrWhiteSpace(version)) return (false, "Curriculum version is required.", null);
        if (string.IsNullOrWhiteSpace(title)) return (false, "Curriculum title is required.", null);
        if (request.MinimumCredits < 0) return (false, "Minimum credits cannot be negative.", null);
        if (request.EffectiveTo is not null && request.EffectiveTo < request.EffectiveFrom) return (false, "Effective-to date cannot precede effective-from date.", null);
        if (await curricula.VersionExistsAsync(request.ProgrammeId, version, cancellationToken: ct)) return (false, $"Curriculum version '{version}' already exists for this programme.", null);
        var curriculum = new Curriculum { ProgrammeId = request.ProgrammeId, Version = version, Title = title, MinimumCredits = request.MinimumCredits, EffectiveFrom = request.EffectiveFrom, EffectiveTo = request.EffectiveTo, ProgrammeType = request.ProgrammeType };
        await curricula.AddAsync(curriculum, ct); await curricula.SaveChangesAsync(ct); return (true, null, curriculum);
    }

    public async Task<(bool Success, string? Error, Course? Course)> CreateCourseAsync(CreateCourseRequest request, CancellationToken ct = default)
    {
        var code = request.Code.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Course code is required.", null);
        if (string.IsNullOrWhiteSpace(name)) return (false, "Course name is required.", null);
        if (request.CreditUnits < 0) return (false, "Credit units cannot be negative.", null);
        if (await courses.CodeExistsAsync(code, cancellationToken: ct)) return (false, $"Course code '{code}' already exists.", null);
        var course = new Course { Code = code, Name = name, CreditUnits = request.CreditUnits, Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(), CourseType = string.IsNullOrWhiteSpace(request.CourseType) ? null : request.CourseType.Trim() };
        await courses.AddAsync(course, ct); await courses.SaveChangesAsync(ct); return (true, null, course);
    }

    public async Task<(bool Success, string? Error, CurriculumCourse? Mapping)> AddMappingAsync(Guid curriculumId, AddCurriculumCourseRequest request, CancellationToken ct = default)
    {
        if (curriculumId == Guid.Empty || request.CourseId == Guid.Empty) return (false, "Curriculum and course are required.", null);
        if (request.YearOfStudy < 1) return (false, "Year of study must be at least 1.", null);
        if (request.SemesterNumber < 1) return (false, "Semester number must be at least 1.", null);
        if (await curricula.GetByIdAsync(curriculumId, ct) is null) return (false, "Curriculum not found.", null);
        if (await courses.GetByIdAsync(request.CourseId, ct) is null) return (false, "Course not found.", null);
        if (await mappings.ExistsAsync(curriculumId, request.CourseId, ct)) return (false, "Course is already mapped to this curriculum.", null);
        var mapping = new CurriculumCourse { CurriculumId = curriculumId, CourseId = request.CourseId, YearOfStudy = request.YearOfStudy, SemesterNumber = request.SemesterNumber, IsCore = request.IsCore };
        await mappings.AddAsync(mapping, ct); await mappings.SaveChangesAsync(ct); return (true, null, mapping);
    }
}
