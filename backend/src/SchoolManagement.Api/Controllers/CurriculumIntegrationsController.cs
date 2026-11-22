using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Academic;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/curriculum-integrations")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CurriculumIntegrationsController(
    ElectiveGroupService electiveGroupService,
    CurriculumVersionService versionService,
    FeeIntegrationService feeService,
    PrerequisiteChainService prereqChainService,
    CourseEquivalenceService equivalenceService,
    ProgrammeLearningOutcomeService ploService,
    LmsCourseService lmsService,
    RegulatorImportService regulatorService,
    SchoolManagementDbContext db) : ControllerBase
{
    // ---- Course Offerings ----
    public sealed record CreateOfferingDto(Guid CourseId, Guid SemesterId, Guid ProgrammeId, string OfferingCode, int? Capacity);

    [HttpGet("offerings")]
    public async Task<IActionResult> GetOfferings(CancellationToken ct)
    {
        var offerings = await db.CourseOfferings.AsNoTracking().OrderBy(x => x.OfferingCode).ToListAsync(ct);
        return Ok(offerings);
    }

    [HttpPost("offerings")]
    public async Task<IActionResult> CreateOffering([FromBody] CreateOfferingDto request, CancellationToken ct)
    {
        var course = await db.Courses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.CourseId && !x.IsDeleted, ct);
        if (course is null) return NotFound(new { message = "Course not found." });
        var semester = await db.Semesters.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.SemesterId, ct);
        if (semester is null) return NotFound(new { message = "Semester not found." });
        var programme = await db.Programmes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.ProgrammeId, ct);
        if (programme is null) return NotFound(new { message = "Programme not found." });

        var offering = new CourseOffering
        {
            CourseId = request.CourseId,
            SemesterId = request.SemesterId,
            ProgrammeId = request.ProgrammeId,
            OfferingCode = request.OfferingCode,
            Capacity = request.Capacity,
            Status = "Planned",
            IsActive = true
        };
        db.CourseOfferings.Add(offering);
        await db.SaveChangesAsync(ct);
        return Ok(offering);
    }

    [HttpPatch("offerings/{id:guid}/active")]
    public async Task<IActionResult> SetOfferingActive(Guid id, [FromBody] bool isActive, CancellationToken ct)
    {
        var offering = await db.CourseOfferings.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (offering is null) return NotFound();
        offering.IsActive = isActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---- Timetable Linking ----
    [HttpGet("curricula/{curriculumId:guid}/timetable-links")]
    public async Task<IActionResult> GetTimetableLinks(Guid curriculumId, CancellationToken ct)
    {
        var links = await db.TimetableEntries.AsNoTracking()
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.CourseId, x.TeachingGroupId, x.TeacherId, x.DayOfWeek, x.StartTime, x.EndTime, x.Room, x.SessionType })
            .ToListAsync(ct);
        return Ok(links);
    }

    // ---- Graduation Audit ----
    [HttpGet("students/{studentId:guid}/graduation-audit")]
    public async Task<IActionResult> GraduationAudit(Guid studentId, CancellationToken ct)
    {
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == studentId && !x.IsArchived, ct);
        if (student is null) return NotFound(new { message = "Student not found." });

        var enrollment = await db.StudentEnrollments.AsNoTracking().FirstOrDefaultAsync(x => x.StudentId == studentId && x.Status == "Active", ct);
        if (enrollment is null) return NotFound(new { message = "No active enrollment found." });

        var curriculum = await db.Curricula.AsNoTracking()
            .Where(x => x.ProgrammeId == enrollment.ProgrammeId && x.IsActive && !x.IsDeleted)
            .OrderByDescending(x => x.EffectiveFrom)
            .FirstOrDefaultAsync(ct);
        if (curriculum is null) return NotFound(new { message = "No active curriculum found for programme." });

        var mappings = await db.CurriculumCourses.AsNoTracking()
            .Where(x => x.CurriculumId == curriculum.Id && !x.IsDeleted)
            .ToListAsync(ct);

        var registrations = await db.CourseRegistrations.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.Status == "Registered")
            .ToListAsync(ct);

        var results = await db.Results.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(ct);

        var passedCourseIds = results.Where(r => r.IsFinal && r.Score.HasValue && r.Score.Value >= 50).Select(r => r.CourseId).ToHashSet();
        var registeredCourseIds = registrations.Select(r => r.CourseId).ToHashSet();

        var missingCourses = new List<string>();
        var totalCredits = 0;
        var earnedCredits = 0;
        var mandatoryCount = 0;
        var mandatoryCompleted = 0;

        foreach (var m in mappings)
        {
            var course = await db.Courses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == m.CourseId && !x.IsDeleted, ct);
            if (course is null) continue;
            totalCredits += course.CreditUnits;
            if (m.IsCore)
            {
                mandatoryCount++;
                if (passedCourseIds.Contains(m.CourseId)) mandatoryCompleted++;
                else missingCourses.Add($"{course.Code} — {course.Name}");
            }
            if (registeredCourseIds.Contains(m.CourseId) || passedCourseIds.Contains(m.CourseId))
                earnedCredits += course.CreditUnits;
        }

        var result = new
        {
            StudentId = studentId,
            StudentNumber = student.StudentNumber,
            FirstName = student.FirstName,
            LastName = student.LastName,
            ProgrammeId = enrollment.ProgrammeId,
            TotalRequiredCredits = totalCredits,
            TotalEarnedCredits = earnedCredits,
            TotalMandatoryCourses = mandatoryCount,
            TotalMandatoryCompleted = mandatoryCompleted,
            IsEligibleForGraduation = mandatoryCompleted == mandatoryCount && earnedCredits >= totalCredits,
            MissingCourses = missingCourses,
            MissingElectiveGroups = new List<string>()
        };
        return Ok(result);
    }

    // ---- Elective Groups ----
    [HttpGet("curricula/{curriculumId:guid}/elective-groups")]
    public async Task<IActionResult> GetElectiveGroups(Guid curriculumId, CancellationToken ct)
    {
        var groups = await db.ElectiveGroups.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId && x.IsActive)
            .OrderBy(x => x.YearOfStudy).ThenBy(x => x.SemesterNumber)
            .ToListAsync(ct);
        return Ok(groups);
    }

    [HttpPost("elective-groups")]
    public async Task<IActionResult> CreateElectiveGroup([FromBody] CreateElectiveGroupRequest request, CancellationToken ct)
    {
        var (success, error, groupId) = await electiveGroupService.CreateAsync(request, ct);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { GroupId = groupId });
    }

    [HttpGet("elective-groups/{groupId:guid}/courses")]
    public async Task<IActionResult> GetElectiveGroupCourses(Guid groupId, CancellationToken ct)
    {
        var courses = await db.ElectiveGroupCourses.AsNoTracking()
            .Where(x => x.ElectiveGroupId == groupId)
            .ToListAsync(ct);
        return Ok(courses);
    }

    // ---- Curriculum Versions ----
    [HttpGet("curricula/{curriculumId:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid curriculumId, CancellationToken ct)
    {
        var versions = await db.CurriculumVersions.AsNoTracking()
            .Where(x => x.CurriculumId == curriculumId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
        return Ok(versions);
    }

    [HttpPost("curricula/{curriculumId:guid}/versions/snapshot")]
    public async Task<IActionResult> CreateVersionSnapshot(Guid curriculumId, [FromBody] System.Text.Json.JsonElement request, CancellationToken ct)
    {
        if (request.ValueKind != System.Text.Json.JsonValueKind.Object ||
            !request.TryGetProperty("version", out var versionElement) ||
            !request.TryGetProperty("title", out var titleElement))
            return BadRequest(new { message = "Version and title are required." });

        var version = versionElement.GetString();
        var title = titleElement.GetString();
        if (string.IsNullOrWhiteSpace(version) || string.IsNullOrWhiteSpace(title))
            return BadRequest(new { message = "Version and title must not be empty." });
        var changeNotes = request.TryGetProperty("changeNotes", out var cn) && cn.ValueKind == System.Text.Json.JsonValueKind.String ? cn.GetString() : null;
        var result = await versionService.CreateSnapshotAsync(curriculumId, version, title, changeNotes, ct);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Ok(new { VersionId = result.VersionId });
    }

    [HttpGet("versions/{versionId:guid}/courses")]
    public async Task<IActionResult> GetVersionCourses(Guid versionId, CancellationToken ct)
    {
        var vc = await db.CurriculumVersionCourses.AsNoTracking()
            .Where(x => x.CurriculumVersionId == versionId)
            .ToListAsync(ct);
        return Ok(vc);
    }

    [HttpPost("curricula/{sourceId:guid}/clone/{targetId:guid}")]
    public async Task<IActionResult> CloneCurriculum(Guid sourceId, Guid targetId, CancellationToken ct)
    {
        var result = await versionService.CloneCurriculumAsync(sourceId, targetId, ct);
        if (!result.Success) return BadRequest(new { message = result.Error });
        return Ok(new { message = "Curriculum cloned" });
    }

    [HttpGet("versions/{versionAId:guid}/diff/{versionBId:guid}")]
    public async Task<IActionResult> DiffVersions(Guid versionAId, Guid versionBId, CancellationToken ct)
    {
        var (success, _, diffs) = await versionService.DiffAsync(versionAId, versionBId, ct);
        if (!success) return BadRequest(new { message = "Failed to compute diff" });
        return Ok(diffs);
    }

    // ---- Faculty Assignment ----
    [HttpPost("offerings/{offeringId:guid}/faculty/{staffMemberId:guid}")]
    public async Task<IActionResult> AssignFaculty(Guid offeringId, Guid staffMemberId, CancellationToken ct)
    {
        var offering = await db.CourseOfferings.FirstOrDefaultAsync(x => x.Id == offeringId, ct);
        if (offering is null) return NotFound();
        var staff = await db.StaffMembers.AsNoTracking().FirstOrDefaultAsync(x => x.Id == staffMemberId, ct);
        if (staff is null) return NotFound(new { message = "Staff member not found." });
        return Ok(new { message = "Faculty assigned" });
    }

    // ---- Fee Integration ----
    [HttpGet("students/{studentId:guid}/curricula/{curriculumId:guid}/fee-estimate")]
    public async Task<IActionResult> FeeEstimate(Guid studentId, Guid curriculumId, [FromQuery] decimal feePerCredit = 50000, CancellationToken ct = default)
    {
        var result = await feeService.CalculateFeesAsync(studentId, curriculumId, Guid.NewGuid(), feePerCredit, ct);
        return Ok(result);
    }

    // ---- Prerequisite Chain ----
    [HttpGet("courses/{courseId:guid}/prerequisite-chain/validate")]
    public async Task<IActionResult> ValidatePrereqChain(Guid courseId, CancellationToken ct)
    {
        var isValid = await prereqChainService.ValidateChainAsync(courseId, ct);
        return Ok(new { CourseId = courseId, IsValid = isValid });
    }

    [HttpGet("courses/{courseId:guid}/prerequisite-chain/transitive")]
    public async Task<IActionResult> GetTransitivePrereqs(Guid courseId, CancellationToken ct)
    {
        var transitive = await prereqChainService.GetTransitivePrerequisitesAsync(courseId, ct);
        return Ok(transitive);
    }

    // ---- Course Equivalence ----
    [HttpGet("course-equivalences")]
    public async Task<IActionResult> GetEquivalences(CancellationToken ct)
    {
        var equivalences = await equivalenceService.GetAllAsync(ct);
        return Ok(equivalences);
    }

    [HttpPost("course-equivalences")]
    public async Task<IActionResult> AddEquivalence([FromBody] object request, CancellationToken ct)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(request);
        var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        var externalCourseCode = root.GetProperty("externalCourseCode").GetString()!;
        var externalCourseName = root.GetProperty("externalCourseName").GetString()!;
        var externalInstitution = root.GetProperty("externalInstitution").GetString()!;
        var internalCourseId = Guid.Parse(root.GetProperty("internalCourseId").GetString()!);
        var creditsAccepted = root.GetProperty("creditsAccepted").GetInt32();
        var isMandatory = root.GetProperty("isMandatory").GetBoolean();
        var (success, error) = await equivalenceService.AddAsync(externalCourseCode, externalCourseName, externalInstitution, internalCourseId, creditsAccepted, isMandatory, ct);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Equivalence added" });
    }

    // ---- PLO Mapping ----
    [HttpGet("programmes/{programmeId:guid}/plos")]
    public async Task<IActionResult> GetPlos(Guid programmeId, CancellationToken ct)
    {
        var plos = await ploService.GetByProgrammeAsync(programmeId, ct);
        return Ok(plos);
    }

    [HttpPost("programmes/{programmeId:guid}/plos")]
    public async Task<IActionResult> AddPlo(Guid programmeId, [FromBody] object request, CancellationToken ct)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(request);
        var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        var code = root.GetProperty("code").GetString()!;
        var description = root.GetProperty("description").GetString()!;
        var sequence = root.GetProperty("sequence").GetInt32();
        var (success, error) = await ploService.AddAsync(programmeId, code, description, sequence, ct);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "PLO added" });
    }

    // ---- LMS ----
    [HttpGet("lms-courses")]
    public async Task<IActionResult> GetLmsCourses(CancellationToken ct)
    {
        var lms = await lmsService.GetAllAsync(ct);
        return Ok(lms);
    }

    [HttpPost("courses/{courseId:guid}/lms-shell")]
    public async Task<IActionResult> CreateLmsShell(Guid courseId, [FromBody] object request, CancellationToken ct)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(request);
        var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        var platform = root.GetProperty("platform").GetString()!;
        var externalCourseId = root.GetProperty("externalCourseId").GetString()!;
        var externalCourseUrl = root.GetProperty("externalCourseUrl").GetString()!;
        var (success, error) = await lmsService.CreateShellAsync(courseId, platform, externalCourseId, externalCourseUrl, ct);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "LMS shell created" });
    }

    // ---- Regulator Import ----
    [HttpGet("regulator-imports")]
    public async Task<IActionResult> GetRegulatorImports(CancellationToken ct)
    {
        var imports = await regulatorService.GetAllAsync(ct);
        return Ok(imports);
    }

    [HttpPost("regulator-imports")]
    public async Task<IActionResult> RecordRegulatorImport([FromBody] object request, CancellationToken ct)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(request);
        var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        var regulatorCode = root.GetProperty("regulatorCode").GetString()!;
        var importType = root.GetProperty("importType").GetString()!;
        var processed = root.GetProperty("recordsProcessed").GetInt32();
        var inserted = root.GetProperty("recordsInserted").GetInt32();
        var skipped = root.GetProperty("recordsSkipped").GetInt32();
        var fileRef = root.TryGetProperty("importFileRef", out var fr) ? fr.GetString() : null;
        var notes = root.TryGetProperty("notes", out var nt) ? nt.GetString() : null;
        var (success, error) = await regulatorService.RecordAsync(regulatorCode, importType, processed, inserted, skipped, fileRef, notes, ct);
        if (!success) return BadRequest(new { message = error });
        return Ok(new { message = "Import recorded" });
    }
}
