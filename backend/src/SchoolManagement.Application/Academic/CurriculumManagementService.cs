using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateCurriculumRequest(Guid ProgrammeId, string Version, string Title, int MinimumCredits, DateOnly EffectiveFrom, DateOnly? EffectiveTo, ProgrammeType ProgrammeType = ProgrammeType.FullProgramme);
public sealed record CreateCourseRequest(string AuthorityCode, string Code, string Name, int CreditUnits, string? Description, string? CourseType);
public sealed record UpdateCourseRequest(string AuthorityCode, string Code, string Name, int CreditUnits, string? Description, string? CourseType, bool IsActive);
public sealed record UpdateCurriculumRequest(string Version, string Title, int MinimumCredits, DateOnly EffectiveFrom, DateOnly? EffectiveTo, ProgrammeType ProgrammeType, bool IsActive);
public sealed record AddCurriculumCourseRequest(Guid CourseId, int YearOfStudy, int SemesterNumber, bool IsCore);
public sealed record UpdateCurriculumCourseRequest(int YearOfStudy, int SemesterNumber, bool IsCore);

public sealed class CurriculumManagementService(
    ICurriculumRepository curricula,
    ICourseRepository courses,
    ICurriculumCourseRepository mappings,
    IProgrammeRepository programmes)
{
    public Task<IReadOnlyList<Curriculum>> GetCurriculaAsync(CancellationToken ct = default) => curricula.GetAllAsync(ct);
    public Task<IReadOnlyList<Course>> GetCoursesAsync(CancellationToken ct = default) => courses.GetAllAsync(ct);
    public Task<IReadOnlyList<CurriculumCourse>> GetMappingsAsync(Guid curriculumId, CancellationToken ct = default) => mappings.GetByCurriculumAsync(curriculumId, ct);

    public async Task<(bool Success, string? Error)> UpdateCurriculumAsync(Guid id, UpdateCurriculumRequest request, CancellationToken ct = default)
    {
        var existing = await curricula.GetByIdAsync(id, ct);
        if (existing is null) return (false, "Curriculum not found.");
        var programme = await programmes.GetByIdAsync(existing.ProgrammeId, ct);
        if (programme is null || programme.Type != request.ProgrammeType) return (false, "Curriculum category must match the programme category.");
        var version = request.Version.Trim(); var title = request.Title.Trim();
        if (string.IsNullOrWhiteSpace(version) || string.IsNullOrWhiteSpace(title)) return (false, "Curriculum version and title are required.");
        if (request.MinimumCredits < 0) return (false, "Minimum credits cannot be negative.");
        if (request.EffectiveTo is not null && request.EffectiveTo < request.EffectiveFrom) return (false, "Effective-to date cannot precede effective-from date.");
        if (await curricula.VersionExistsAsync(existing.ProgrammeId, version, id, ct)) return (false, "That curriculum version already exists for this programme.");
        existing.Version = version; existing.Title = title; existing.MinimumCredits = request.MinimumCredits;
        existing.EffectiveFrom = request.EffectiveFrom; existing.EffectiveTo = request.EffectiveTo;
        existing.ProgrammeType = request.ProgrammeType; existing.IsActive = request.IsActive;
        await curricula.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> SetCurriculumActiveAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        var existing = await curricula.GetByIdAsync(id, ct);
        if (existing is null) return (false, "Curriculum not found.");
        existing.IsActive = isActive;
        await curricula.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, Curriculum? Curriculum)> CreateCurriculumAsync(CreateCurriculumRequest request, CancellationToken ct = default)
    {
        var version = request.Version.Trim();
        var title = request.Title.Trim();
        if (request.ProgrammeId == Guid.Empty) return (false, "Programme is required.", null);
        var programme = await programmes.GetByIdAsync(request.ProgrammeId, ct);
        if (programme is null) return (false, "Programme not found.", null);
        if (programme.Type != request.ProgrammeType) return (false, "Curriculum category must match the selected programme category.", null);
        if (!programme.IsActive || programme.IsReferenceOnly)
            return (false, "Only active, non-reference programmes can receive a curriculum.", null);
        if (string.IsNullOrWhiteSpace(version)) return (false, "Curriculum version is required.", null);
        if (string.IsNullOrWhiteSpace(title)) return (false, "Curriculum title is required.", null);
        if (request.MinimumCredits < 0) return (false, "Minimum credits cannot be negative.", null);
        if (request.EffectiveTo is not null && request.EffectiveTo < request.EffectiveFrom) return (false, "Effective-to date cannot precede effective-from date.", null);
        if (await curricula.VersionExistsAsync(request.ProgrammeId, version, cancellationToken: ct)) return (false, $"Curriculum version '{version}' already exists for this programme.", null);
        var curriculum = new Curriculum { ProgrammeId = request.ProgrammeId, Version = version, Title = title, MinimumCredits = request.MinimumCredits, EffectiveFrom = request.EffectiveFrom, EffectiveTo = request.EffectiveTo, ProgrammeType = request.ProgrammeType };
        await curricula.AddAsync(curriculum, ct); await curricula.SaveChangesAsync(ct); return (true, null, curriculum);
    }

    public async Task<(bool Success, string? Error)> UpdateCourseAsync(Guid id, UpdateCourseRequest request, CancellationToken ct = default)
    {
        var existing = await courses.GetByIdAsync(id, ct);
        if (existing is null) return (false, "Course not found.");
        var code = request.Code.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) return (false, "Course code and name are required.");
        if (request.CreditUnits < 0) return (false, "Credit units cannot be negative.");
        if (await courses.CodeExistsAsync(code, id, ct)) return (false, $"Course code '{code}' already exists.");
        existing.AuthorityCode = request.AuthorityCode.Trim().ToUpperInvariant();
        existing.Code = code; existing.Name = name; existing.CreditUnits = request.CreditUnits;
        existing.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        existing.CourseType = string.IsNullOrWhiteSpace(request.CourseType) ? null : request.CourseType.Trim();
        existing.IsActive = request.IsActive;
        await courses.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, Course? Course)> CreateCourseAsync(CreateCourseRequest request, CancellationToken ct = default)
    {
        var code = request.Code.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(code)) return (false, "Course code is required.", null);
        if (string.IsNullOrWhiteSpace(name)) return (false, "Course name is required.", null);
        if (request.CreditUnits < 0) return (false, "Credit units cannot be negative.", null);
        if (await courses.CodeExistsAsync(code, cancellationToken: ct)) return (false, $"Course code '{code}' already exists.", null);
        var course = new Course { AuthorityCode = request.AuthorityCode.Trim().ToUpperInvariant(), Code = code, Name = name, CreditUnits = request.CreditUnits, Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(), CourseType = string.IsNullOrWhiteSpace(request.CourseType) ? null : request.CourseType.Trim() };
        await courses.AddAsync(course, ct); await courses.SaveChangesAsync(ct); return (true, null, course);
    }

    public async Task<(bool Success, string? Error)> UpdateMappingAsync(Guid curriculumId, Guid mappingId, UpdateCurriculumCourseRequest request, CancellationToken ct = default)
    {
        if (request.YearOfStudy < 1 || request.SemesterNumber < 1) return (false, "Year and semester numbers must be positive.");
        var mapping = await mappings.GetByIdAsync(mappingId, ct);
        if (mapping is null || mapping.CurriculumId != curriculumId) return (false, "Curriculum course mapping not found.");
        mapping.YearOfStudy = request.YearOfStudy;
        mapping.SemesterNumber = request.SemesterNumber;
        mapping.IsCore = request.IsCore;
        await mappings.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, CurriculumCourse? Mapping)> AddMappingAsync(Guid curriculumId, AddCurriculumCourseRequest request, CancellationToken ct = default)
    {
        if (curriculumId == Guid.Empty || request.CourseId == Guid.Empty) return (false, "Curriculum and course are required.", null);
        if (request.YearOfStudy < 1) return (false, "Year of study must be at least 1.", null);
        if (request.SemesterNumber < 1) return (false, "Semester number must be at least 1.", null);
        var curriculum = await curricula.GetByIdAsync(curriculumId, ct);
        if (curriculum is null) return (false, "Curriculum not found.", null);
        if (!curriculum.IsActive) return (false, "Activate the curriculum before adding courses.", null);
        var programme = await programmes.GetByIdAsync(curriculum.ProgrammeId, ct);
        if (programme is null) return (false, "The curriculum's programme was not found.", null);
        if (!programme.IsActive || programme.IsReferenceOnly)
            return (false, "Only active, non-reference programmes can receive curriculum course mappings.", null);
        var course = await courses.GetByIdAsync(request.CourseId, ct);
        if (course is null) return (false, "Course not found.", null);
        if (!course.IsActive) return (false, "Activate the course before adding it to a curriculum.", null);
        if (await mappings.ExistsAsync(curriculumId, request.CourseId, ct)) return (false, "Course is already mapped to this curriculum.", null);
        var mapping = new CurriculumCourse { CurriculumId = curriculumId, CourseId = request.CourseId, YearOfStudy = request.YearOfStudy, SemesterNumber = request.SemesterNumber, IsCore = request.IsCore };
        await mappings.AddAsync(mapping, ct); await mappings.SaveChangesAsync(ct); return (true, null, mapping);
    }

    public async Task<bool> DeleteCourseAsync(Guid id, CancellationToken ct = default)
    {
        var course = await courses.GetByIdAsync(id, ct);
        if (course is null) return false;
        await courses.DeleteAsync(id, ct);
        await courses.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteMappingAsync(Guid curriculumId, Guid mappingId, CancellationToken ct = default)
    {
        var mapping = await mappings.GetByIdAsync(mappingId, ct);
        if (mapping is null || mapping.CurriculumId != curriculumId) return false;
        await mappings.RemoveAsync(mappingId, ct);
        await mappings.SaveChangesAsync(ct);
        return true;
    }
}
