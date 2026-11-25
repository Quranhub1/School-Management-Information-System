using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/curriculum-management")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumManagementController(CurriculumManagementService service, SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("curricula")]
    public async Task<IActionResult> GetCurricula(CancellationToken ct) => Ok((await service.GetCurriculaAsync(ct)).Select(CurriculumResponseDto.FromDomain).ToArray());

    [HttpGet("curricula/{id:guid}")]
    public async Task<IActionResult> GetCurriculum(Guid id, CancellationToken ct)
    {
        var curriculum = await db.Curricula.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });
        return Ok(CurriculumResponseDto.FromDomain(curriculum));
    }

    [HttpPut("curricula/{id:guid}")]
    public async Task<IActionResult> UpdateCurriculum(Guid id, [FromBody] UpdateCurriculumRequest request, CancellationToken ct)
    {
        var authorityActive = await (
            from curriculum in db.Curricula.AsNoTracking()
            join programme in db.Programmes.AsNoTracking() on curriculum.ProgrammeId equals programme.Id
            join authority in db.AcademicAuthorities.AsNoTracking() on programme.Regulator equals authority.Code
            where curriculum.Id == id && authority.IsActive
            select authority.Id).AnyAsync(ct);
        if (!authorityActive) return Conflict(new { message = "The curriculum's academic authority is inactive or no longer registered." });
        var currentStatus = await db.Curricula.AsNoTracking().Where(x => x.Id == id && !x.IsDeleted).Select(x => x.Status).SingleOrDefaultAsync(ct);
        if (currentStatus is null) return NotFound(new { message = "Curriculum not found." });
        if (!string.Equals(currentStatus, "Draft", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only draft curricula can be edited. Clone an approved version to create a new draft." });
        var (success, error) = await service.UpdateCurriculumAsync(id, request, ct);
        return success ? NoContent() : error == "Curriculum not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPatch("curricula/{id:guid}/active")]
    public async Task<IActionResult> SetCurriculumActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken ct)
    {
        var status = await db.Curricula.AsNoTracking().Where(x => x.Id == id && !x.IsDeleted).Select(x => x.Status).SingleOrDefaultAsync(ct);
        if (status is null) return NotFound(new { message = "Curriculum not found." });
        if (string.Equals(status, "Retired", StringComparison.OrdinalIgnoreCase) && request.IsActive)
            return Conflict(new { message = "A retired curriculum cannot be reactivated. Clone it to create a new draft version." });
        var (success, error) = await service.SetCurriculumActiveAsync(id, request.IsActive, ct);
        return success ? NoContent() : error == "Curriculum not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPost("curricula/{id:guid}/submit-for-review")]
    public async Task<IActionResult> SubmitForReview(Guid id, CancellationToken ct)
    {
        var curriculum = await db.Curricula.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });
        if (curriculum.Status != "Draft") return BadRequest(new { message = "Only draft curricula can be submitted for review." });
        curriculum.Status = "Submitted";
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("curricula/{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
    {
        var curriculum = await db.Curricula.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });
        if (curriculum.Status != "Submitted") return BadRequest(new { message = "Only submitted curricula can be approved." });
        curriculum.Status = "Approved";
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("curricula/{id:guid}/publish")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct)
    {
        var curriculum = await db.Curricula.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });
        if (curriculum.Status != "Approved") return BadRequest(new { message = "Only approved curricula can be published." });
        curriculum.Status = "Published";
        curriculum.IsActive = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("curricula/{curriculumId:guid}/credit-load")]
    public async Task<IActionResult> GetCreditLoad(Guid curriculumId, CancellationToken ct)
    {
        var mappings = await db.CurriculumCourses.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId && !x.IsDeleted)
            .ToListAsync(ct);
        var loadBySemester = mappings
            .GroupBy(m => new { m.YearOfStudy, m.SemesterNumber })
            .Select(g => new
            {
                Year = g.Key.YearOfStudy,
                Semester = g.Key.SemesterNumber,
                CourseCount = g.Count(),
                TotalCredits = g.Sum(m =>
                {
                    var course = db.Courses.FirstOrDefault(x => x.Id == m.CourseId && !x.IsDeleted);
                    return course?.CreditUnits ?? 0;
                })
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Semester)
            .ToList();
        return Ok(loadBySemester);
    }

    [HttpPost("curricula")]
    public async Task<IActionResult> CreateCurriculum([FromBody] CreateCurriculumRequest request, CancellationToken ct)
    {
        var authorityActive = await (
            from programme in db.Programmes.AsNoTracking()
            join authority in db.AcademicAuthorities.AsNoTracking() on programme.Regulator equals authority.Code
            where programme.Id == request.ProgrammeId && authority.IsActive
            select authority.Id).AnyAsync(ct);
        if (!authorityActive) return Conflict(new { message = "Select a programme registered under an active academic authority." });
        var result = await service.CreateCurriculumAsync(request, ct);
        return result.Success && result.Curriculum is not null ? Ok(CurriculumResponseDto.FromDomain(result.Curriculum)) : BadRequest(new { message = result.Error });
    }

    [HttpGet("courses")]
    public async Task<IActionResult> GetCourses([FromQuery] string? authorityCode, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(authorityCode))
        {
            var allCourses = await db.Courses.AsNoTracking()
                .Where(x => !x.IsDeleted)
                .OrderBy(x => x.Code)
                .ToListAsync(ct);
            return Ok(allCourses.Select(CourseResponseDto.FromDomain).ToArray());
        }

        var code = authorityCode.Trim().ToUpperInvariant();
        if (!await db.AcademicAuthorities.AsNoTracking().AnyAsync(x => x.Code == code && x.IsActive, ct))
            return NotFound(new { message = "The selected academic authority is not registered or active." });
        var courses = await db.Courses.AsNoTracking()
            .Where(x => !x.IsDeleted && (x.AuthorityCode == code || x.AuthorityCode == null))
            .OrderBy(x => x.AuthorityCode == null).ThenBy(x => x.Code).ToListAsync(ct);
        return Ok(courses.Select(CourseResponseDto.FromDomain).ToArray());
    }

    [HttpPut("courses/{id:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid id, [FromBody] UpdateCourseRequest request, CancellationToken ct)
    {
        var existing = await db.Courses.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (existing is null) return NotFound(new { message = "Course not found." });
        var authorityCode = request.AuthorityCode?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(authorityCode) || !await db.AcademicAuthorities.AnyAsync(x => x.Code == authorityCode && x.IsActive, ct))
            return BadRequest(new { message = "Select a registered, active academic authority for this course." });
        if (!string.IsNullOrWhiteSpace(existing.AuthorityCode) && !string.Equals(existing.AuthorityCode, authorityCode, StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "A course already assigned to an authority cannot be transferred. Create a new course record under the other authority instead." });
        var mappedAuthorities = await (
            from mapping in db.CurriculumCourses.AsNoTracking()
            join curriculum in db.Curricula.AsNoTracking() on mapping.CurriculumId equals curriculum.Id
            join programme in db.Programmes.AsNoTracking() on curriculum.ProgrammeId equals programme.Id
            where mapping.CourseId == id && programme.Regulator != null
            select programme.Regulator!).Distinct().ToListAsync(ct);
        if (mappedAuthorities.Any(code => !string.Equals(code, authorityCode, StringComparison.OrdinalIgnoreCase)))
            return Conflict(new { message = "This legacy course is mapped to another authority. Create a course under the selected authority and replace the affected curriculum mappings before retiring the legacy course." });
        var (success, error) = await service.UpdateCourseAsync(id, request with { AuthorityCode = authorityCode }, ct);
        return success ? NoContent() : error == "Course not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPatch("courses/{id:guid}/active")]
    public async Task<IActionResult> SetCourseActive(Guid id, [FromBody] SetActiveRequest request, CancellationToken ct)
    {
        var course = await db.Courses.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (course is null) return NotFound(new { message = "Course not found." });
        course.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request, CancellationToken ct)
    {
        var authorityCode = request.AuthorityCode?.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(authorityCode) || !await db.AcademicAuthorities.AnyAsync(x => x.Code == authorityCode && x.IsActive, ct))
            return BadRequest(new { message = "Select a registered, active academic authority for this course." });
        var result = await service.CreateCourseAsync(request with { AuthorityCode = authorityCode }, ct);
        return result.Success ? Ok(result.Course) : BadRequest(new { message = result.Error });
    }

    [HttpGet("curricula/{curriculumId:guid}/courses")]
    public async Task<IActionResult> GetMappings(Guid curriculumId, CancellationToken ct) => Ok(await service.GetMappingsAsync(curriculumId, ct));

    [HttpDelete("courses/{id:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid id, CancellationToken ct)
    {
        var deleted = await service.DeleteCourseAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    [HttpDelete("curricula/{curriculumId:guid}/courses/{mappingId:guid}")]
    public async Task<IActionResult> DeleteMapping(Guid curriculumId, Guid mappingId, CancellationToken ct)
    {
        var deleted = await service.DeleteMappingAsync(curriculumId, mappingId, ct);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPut("curricula/{curriculumId:guid}/semesters/{year:int}/{semester:int}")]
    public async Task<IActionResult> UpdateSemester(Guid curriculumId, int year, int semester,
        [FromBody] UpdateCurriculumSemesterRequest request, CancellationToken ct)
    {
        if (request.YearOfStudy < 1 || request.SemesterNumber < 1)
            return BadRequest(new { message = "Year and semester numbers must be positive." });
        var curriculumStatus = await db.Curricula.AsNoTracking().Where(x => x.Id == curriculumId && !x.IsDeleted).Select(x => x.Status).SingleOrDefaultAsync(ct);
        if (curriculumStatus is null) return NotFound(new { message = "Curriculum not found." });
        if (!string.Equals(curriculumStatus, "Draft", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only draft curricula can have semester placements changed." });
        var mappings = await db.CurriculumCourses.Where(x =>
            x.CurriculumId == curriculumId && x.YearOfStudy == year && x.SemesterNumber == semester).ToListAsync(ct);
        if (mappings.Count == 0) return NotFound(new { message = "Semester not found in this curriculum." });
        foreach (var mapping in mappings)
        {
            mapping.YearOfStudy = request.YearOfStudy;
            mapping.SemesterNumber = request.SemesterNumber;
        }
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("curricula/{curriculumId:guid}/semesters/{year:int}/{semester:int}")]
    public async Task<IActionResult> DeleteSemester(Guid curriculumId, int year, int semester, CancellationToken ct)
    {
        var curriculumStatus = await db.Curricula.AsNoTracking().Where(x => x.Id == curriculumId && !x.IsDeleted).Select(x => x.Status).SingleOrDefaultAsync(ct);
        if (curriculumStatus is null) return NotFound(new { message = "Curriculum not found." });
        if (!string.Equals(curriculumStatus, "Draft", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only draft curricula can have semesters deleted." });
        var mappings = await db.CurriculumCourses.Where(x =>
            x.CurriculumId == curriculumId && x.YearOfStudy == year && x.SemesterNumber == semester).ToListAsync(ct);
        if (mappings.Count == 0) return NotFound(new { message = "Semester not found in this curriculum." });
        db.CurriculumCourses.RemoveRange(mappings);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    public sealed record UpdateCurriculumSemesterRequest(int YearOfStudy, int SemesterNumber);

    [HttpPut("curricula/{curriculumId:guid}/courses/{mappingId:guid}")]
    public async Task<IActionResult> UpdateMapping(Guid curriculumId, Guid mappingId, [FromBody] UpdateCurriculumCourseRequest request, CancellationToken ct)
    {
        var mapping = await db.CurriculumCourses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == mappingId && x.CurriculumId == curriculumId, ct);
        if (mapping is null) return NotFound(new { message = "Curriculum course mapping not found." });
        var curriculumStatus = await db.Curricula.AsNoTracking().Where(x => x.Id == curriculumId && !x.IsDeleted).Select(x => x.Status).SingleOrDefaultAsync(ct);
        if (!string.Equals(curriculumStatus, "Draft", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only draft curricula can have course-unit placements changed." });
        var creditLoadOk = await service.ValidateCreditLoadAsync(curriculumId, request.YearOfStudy, request.SemesterNumber, ct);
        if (!creditLoadOk)
        {
            return Conflict(new { message = $"Year {request.YearOfStudy}, Semester {request.SemesterNumber} would exceed the maximum credit load (24 units). Remove or move some course units first." });
        }
        var (success, error) = await service.UpdateMappingAsync(curriculumId, mappingId, request, ct);
        return success ? NoContent() : error == "Curriculum course mapping not found." ? NotFound(new { message = error }) : BadRequest(new { message = error });
    }

    [HttpPost("curricula/{curriculumId:guid}/courses")]
    public async Task<IActionResult> AddMapping(Guid curriculumId, [FromBody] AddCurriculumCourseRequest request, CancellationToken ct)
    {
        var curriculum = await db.Curricula.AsNoTracking()
            .Where(x => x.Id == curriculumId)
            .Join(db.Programmes.AsNoTracking(), x => x.ProgrammeId, p => p.Id, (x, p) => new { Curriculum = x, Programme = p })
            .Join(db.AcademicAuthorities.AsNoTracking(), x => x.Programme.Regulator, authority => authority.Code,
                (x, authority) => new { x.Curriculum, x.Programme, Authority = authority.Code, AuthorityIsActive = authority.IsActive })
            .SingleOrDefaultAsync(ct);
        if (curriculum is null)
            return NotFound(new { message = "The selected curriculum, programme or registered academic authority does not exist." });
        if (!curriculum.AuthorityIsActive)
            return Conflict(new { message = "The programme's academic authority is inactive. Activate it before changing curriculum mappings." });
        if (!curriculum.Programme.IsActive || curriculum.Programme.IsReferenceOnly)
            return Conflict(new { message = "Only active, non-reference programmes can receive curriculum course mappings." });
        if (!curriculum.Curriculum.IsActive)
            return Conflict(new { message = "Activate the curriculum before changing its course mappings." });
        if (!string.Equals(curriculum.Curriculum.Status, "Draft", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only draft curricula can have course-unit mappings changed. Clone an approved version first." });

        var course = await db.Courses.FirstOrDefaultAsync(x => x.Id == request.CourseId && x.IsActive, ct);
        if (course is null) return NotFound(new { message = "The selected active course does not exist." });
        if (!string.IsNullOrWhiteSpace(course.AuthorityCode) && !string.Equals(course.AuthorityCode, curriculum.Authority, StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "This course belongs to a different academic authority. Select a course from the current authority catalogue." });
        if (string.IsNullOrWhiteSpace(course.AuthorityCode)) course.AuthorityCode = curriculum.Authority;

        var otherAuthority = await (
            from mapping in db.CurriculumCourses.AsNoTracking()
            join existingCurriculum in db.Curricula.AsNoTracking() on mapping.CurriculumId equals existingCurriculum.Id
            join programme in db.Programmes.AsNoTracking() on existingCurriculum.ProgrammeId equals programme.Id
            join authority in db.AcademicAuthorities.AsNoTracking() on programme.Regulator equals authority.Code
            where mapping.CourseId == request.CourseId && mapping.CurriculumId != curriculumId
            select authority.Code)
            .ToListAsync(ct);

        if (otherAuthority.Any(regulator => !string.Equals(
                regulator, curriculum.Authority, StringComparison.OrdinalIgnoreCase)))
        {
            return Conflict(new
            {
                message = $"This course is already assigned to a different curriculum authority. A course cannot be shared between {curriculum.Authority} and another authority."
            });
        }

        var prerequisitesMet = await service.ValidatePrerequisitesAsync(curriculumId, request.CourseId, ct);
        if (!prerequisitesMet)
        {
            var missingPrereqs = await service.GetCoursePrerequisitesAsync(request.CourseId, ct);
            var missing = missingPrereqs.Where(p => p.IsMandatory).Select(p => $"{p.PrerequisiteCode} — {p.PrerequisiteName}").ToList();
            return Conflict(new { message = "Mandatory prerequisites not yet mapped to this curriculum: " + string.Join(", ", missing) });
        }

        var creditLoadOk = await service.ValidateCreditLoadAsync(curriculumId, request.YearOfStudy, request.SemesterNumber, ct);
        if (!creditLoadOk)
        {
            return Conflict(new { message = $"Year {request.YearOfStudy}, Semester {request.SemesterNumber} would exceed the maximum credit load (24 units). Remove or move some course units first." });
        }

        var result = await service.AddMappingAsync(curriculumId, request, ct);
        return result.Success ? Ok(result.Mapping) : BadRequest(new { message = result.Error });
    }

    public sealed record BulkAddCurriculumCoursesRequest(string[] CourseIds, int YearOfStudy, int SemesterNumber, bool IsCore);

    [HttpPost("curricula/{curriculumId:guid}/courses/bulk")]
    public async Task<IActionResult> BulkAddMapping(Guid curriculumId, [FromBody] BulkAddCurriculumCoursesRequest request, CancellationToken ct)
    {
        if (request.CourseIds == null || request.CourseIds.Length == 0)
            return BadRequest(new { message = "At least one course is required." });
        if (request.YearOfStudy < 1 || request.SemesterNumber < 1)
            return BadRequest(new { message = "Year and semester numbers must be positive." });

        var results = new List<object>();
        var errors = new List<string>();

        foreach (var courseIdStr in request.CourseIds)
        {
            if (!Guid.TryParse(courseIdStr, out var courseId))
            {
                errors.Add($"Invalid course ID: {courseIdStr}");
                continue;
            }

            var prerequisitesMet = await service.ValidatePrerequisitesAsync(curriculumId, courseId, ct);
            if (!prerequisitesMet)
            {
                var missingPrereqs = await service.GetCoursePrerequisitesAsync(courseId, ct);
                var missing = missingPrereqs.Where(p => p.IsMandatory).Select(p => $"{p.PrerequisiteCode} — {p.PrerequisiteName}").ToList();
                errors.Add($"Course {courseIdStr}: missing mandatory prerequisites: {string.Join(", ", missing)}");
                continue;
            }

            var creditLoadOk = await service.ValidateCreditLoadAsync(curriculumId, request.YearOfStudy, request.SemesterNumber, ct);
            if (!creditLoadOk)
            {
                errors.Add($"Course {courseIdStr}: would exceed credit load for Year {request.YearOfStudy}, Semester {request.SemesterNumber}");
                continue;
            }

            var result = await service.AddMappingAsync(curriculumId, new AddCurriculumCourseRequest(courseId, request.YearOfStudy, request.SemesterNumber, request.IsCore), ct);
            if (result.Success && result.Mapping is not null)
                results.Add(CurriculumCourseResponseDto.FromDomain(result.Mapping));
            else
                errors.Add($"Course {courseIdStr}: {result.Error}");
        }

        if (errors.Count > 0)
            return Conflict(new { Added = results.Count, Errors = errors });

        return Ok(results);
    }

    [HttpGet("curricula/{curriculumId:guid}/courses/export")]
    public async Task<IActionResult> ExportCurriculumCsv(Guid curriculumId, CancellationToken ct)
    {
        var curriculum = await db.Curricula.AsNoTracking().FirstOrDefaultAsync(x => x.Id == curriculumId && !x.IsDeleted, ct);
        if (curriculum is null) return NotFound(new { message = "Curriculum not found." });

        var mappings = await db.CurriculumCourses.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId && !x.IsDeleted)
            .OrderBy(x => x.YearOfStudy).ThenBy(x => x.SemesterNumber).ThenBy(x => x.CourseId)
            .ToListAsync(ct);

        var csv = new System.Text.StringBuilder();
        csv.AppendLine("Year,Semester,Course Code,Course Name,Credit Units,Core/Elective");
        foreach (var m in mappings)
        {
            var course = await db.Courses.FirstOrDefaultAsync(x => x.Id == m.CourseId && !x.IsDeleted, ct);
            csv.AppendLine($"{m.YearOfStudy},{m.SemesterNumber},{course?.Code ?? "Unknown"},{course?.Name ?? "Unknown"},{course?.CreditUnits ?? 0},{(m.IsCore ? "Core" : "Elective")}");
        }

        return Content(csv.ToString(), "text/csv", System.Text.Encoding.UTF8);
    }

    [HttpGet("courses/{courseId:guid}/prerequisites")]
    public async Task<IActionResult> GetPrerequisites(Guid courseId, CancellationToken ct)
    {
        var prereqs = await service.GetCoursePrerequisitesAsync(courseId, ct);
        return Ok(prereqs);
    }

    [HttpPost("courses/{courseId:guid}/prerequisites")]
    public async Task<IActionResult> AddPrerequisite(Guid courseId, [FromBody] AddCoursePrerequisiteRequest request, CancellationToken ct)
    {
        var (success, error) = await service.AddCoursePrerequisiteAsync(courseId, request, ct);
        return success ? NoContent() : BadRequest(new { message = error });
    }

    [HttpDelete("courses/{courseId:guid}/prerequisites/{prerequisiteId:guid}")]
    public async Task<IActionResult> RemovePrerequisite(Guid courseId, Guid prerequisiteId, CancellationToken ct)
    {
        var deleted = await service.RemoveCoursePrerequisiteAsync(prerequisiteId, ct);
        return deleted ? NoContent() : NotFound();
    }


public sealed record CurriculumResponseDto(Guid Id, Guid ProgrammeId, string Version, string Title, int MinimumCredits, DateOnly EffectiveFrom, DateOnly? EffectiveTo, SchoolManagement.Domain.Academic.ProgrammeType ProgrammeType, string Status, bool IsActive)
{
    public static CurriculumResponseDto FromDomain(SchoolManagement.Domain.Academic.Curriculum curriculum) => new(
        curriculum.Id, curriculum.ProgrammeId, curriculum.Version, curriculum.Title, curriculum.MinimumCredits,
        curriculum.EffectiveFrom, curriculum.EffectiveTo, curriculum.ProgrammeType, curriculum.Status, curriculum.IsActive);
}

public sealed record CourseResponseDto(Guid Id, string? AuthorityCode, string Code, string Name, int CreditUnits, string? Description, string? CourseType, bool IsActive)
{
    public static CourseResponseDto FromDomain(SchoolManagement.Domain.Academic.Course course) => new(
        course.Id, course.AuthorityCode, course.Code, course.Name, course.CreditUnits, course.Description, course.CourseType, course.IsActive);
}

public sealed record CurriculumCourseResponseDto(Guid Id, Guid CurriculumId, Guid CourseId, int YearOfStudy, int SemesterNumber, bool IsCore)
{
    public static CurriculumCourseResponseDto FromDomain(SchoolManagement.Domain.Academic.CurriculumCourse mapping) => new(
        mapping.Id, mapping.CurriculumId, mapping.CourseId, mapping.YearOfStudy, mapping.SemesterNumber, mapping.IsCore);
}

    public sealed record SetActiveRequest(bool IsActive);
}
