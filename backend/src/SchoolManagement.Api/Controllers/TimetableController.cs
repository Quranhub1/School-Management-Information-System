using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Timetable;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Timetable;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/timetable")]
[Authorize(Policy = TimetablePolicies.Read)]
public sealed class TimetableController(SchoolManagementDbContext db, TimetableGeneratorService generator, ITimetableRepository repository) : ControllerBase
{
    [HttpGet("options")]
    [Authorize(Policy = TimetablePolicies.Read)]
    public async Task<IActionResult> Options(CancellationToken cancellationToken)
    {
        var teachingGroups = await (
            from teachingGroup in db.TeachingGroups.AsNoTracking()
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join semester in db.Semesters.AsNoTracking() on (teachingGroup.SemesterId ?? offering.SemesterId) equals semester.Id
            where teachingGroup.IsActive && (teachingGroup.CurriculumId != null || offering.IsActive)
            orderby teachingGroup.GroupCode
            select new
            {
                teachingGroup.Id,
                Label = teachingGroup.CurriculumId != null
                    ? teachingGroup.Name
                    : teachingGroup.Name == null || teachingGroup.Name == ""
                        ? teachingGroup.GroupCode
                        : teachingGroup.GroupCode + " — " + teachingGroup.Name,
                ProgrammeId = teachingGroup.ProgrammeId ?? offering.ProgrammeId,
                SemesterId = teachingGroup.SemesterId ?? offering.SemesterId,
                CourseId = offering.CourseId,
                CurriculumId = teachingGroup.CurriculumId,
                YearOfStudy = teachingGroup.YearOfStudy,
                SemesterNumber = semester.Sequence,
                IsProgrammeYearClass = teachingGroup.CurriculumId != null
            }).ToListAsync(cancellationToken);
        var courses = await db.Courses.AsNoTracking()
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderBy(x => x.Code)
            .Select(x => new { x.Id, Label = x.Code + " — " + x.Name })
            .ToListAsync(cancellationToken);
        var teachingStaff = await db.StaffMembers.AsNoTracking()
            .Where(x => x.IsActive && x.EmploymentStatus == "Active" && x.StaffType == StaffType.Teaching)
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .Select(x => new
            {
                x.Id,
                Label = (x.LastName + " " + x.FirstName).ToUpper() + " (" + x.StaffNumber + ")",
                x.CourseUnitIdsJson
            })
            .ToListAsync(cancellationToken);
        var teachers = teachingStaff.Select(x => new
        {
            x.Id,
            x.Label,
            CourseUnitIds = ParseCourseUnitIds(x.CourseUnitIdsJson)
        }).ToList();
        var semesters = await (
            from semester in db.Semesters.AsNoTracking()
            join academicYear in db.AcademicYears.AsNoTracking() on semester.AcademicYearId equals academicYear.Id into academicYears
            from academicYear in academicYears.DefaultIfEmpty()
            where semester.IsActive
            orderby semester.IsCurrent descending, semester.StartDate descending
            select new
            {
                semester.Id,
                Label = semester.Name,
                semester.AcademicYearId,
                AcademicYearLabel = academicYear == null ? string.Empty : academicYear.Name,
                semester.StartDate,
                semester.EndDate,
                semester.IsCurrent,
                semester.IsActive
            }).ToListAsync(cancellationToken);
        var programmes = await db.Programmes.AsNoTracking().Where(x => x.IsActive && !x.IsReferenceOnly)
            .OrderBy(x => x.Name).ThenBy(x => x.Code)
            .Select(x => new { x.Id, x.Code, x.DurationYears, x.DurationUnit, Label = x.Name + " (" + x.Award + ")" }).ToListAsync(cancellationToken);
        var curricula = await db.Curricula.AsNoTracking().Where(x => x.IsActive && !x.IsDeleted).OrderByDescending(x => x.EffectiveFrom)
            .Select(x => new { x.Id, x.ProgrammeId, Label = x.Title + " — " + x.Version }).ToListAsync(cancellationToken);
        var curriculumCourses = await (
            from mapping in db.CurriculumCourses.AsNoTracking()
            join curriculum in db.Curricula.AsNoTracking() on mapping.CurriculumId equals curriculum.Id
            join course in db.Courses.AsNoTracking() on mapping.CourseId equals course.Id
            where curriculum.IsActive && !curriculum.IsDeleted && course.IsActive && !course.IsDeleted && !mapping.IsDeleted
            orderby mapping.YearOfStudy, mapping.SemesterNumber, course.Code
            select new { mapping.CurriculumId, curriculum.ProgrammeId, mapping.CourseId,
                CourseLabel = course.Code + " — " + course.Name, mapping.YearOfStudy, mapping.SemesterNumber, mapping.IsCore
            }).ToListAsync(cancellationToken);
        return Ok(new { teachingGroups, courses, teachers, semesters, programmes, curricula, curriculumCourses });
    }

    [HttpGet]
    [Authorize(Policy = TimetablePolicies.Read)]
    public async Task<IActionResult> Get([FromQuery] Guid? teachingGroupId, CancellationToken cancellationToken)
    {
        var entries = await repository.GetActiveAsync(teachingGroupId, cancellationToken);
        return Ok(entries.OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).Select(ToDto).ToList());
    }

    [HttpGet("conflicts")]
    [Authorize(Policy = TimetablePolicies.Read)]
    public async Task<IActionResult> Conflicts([FromQuery] Guid? teachingGroupId, [FromQuery] Guid? semesterId, CancellationToken cancellationToken)
    {
        var candidateQuery = db.TimetableEntries.AsNoTracking().Where(x => x.IsActive);
        if (teachingGroupId.HasValue)
            candidateQuery = candidateQuery.Where(x => x.TeachingGroupId == teachingGroupId.Value);
        if (semesterId.HasValue)
        {
            candidateQuery = candidateQuery.Where(entry => db.TeachingGroups
                .Where(group => group.Id == entry.TeachingGroupId)
                .Join(db.CourseOfferings, group => group.CourseOfferingId, offering => offering.Id,
                    (group, offering) => group.SemesterId ?? offering.SemesterId)
                .Any(id => id == semesterId.Value));
        }

        var candidates = await candidateQuery.ToListAsync(cancellationToken);
        var allActiveEntries = await db.TimetableEntries.AsNoTracking()
            .Where(entry => entry.IsActive)
            .ToListAsync(cancellationToken);
        var conflicts = candidates.Where(candidate => allActiveEntries.Any(other =>
            candidate.Id != other.Id && HasOverlap(candidate, other)));
        return Ok(conflicts.OrderBy(x => x.DayOfWeek).ThenBy(x => x.StartTime).Select(ToDto).ToArray());
    }

    private async Task<bool> IsCourseMappedToTeachingGroupAsync(Guid teachingGroupId, Guid courseId, Guid curriculumId, int yearOfStudy, int curriculumSemesterNumber, CancellationToken cancellationToken)
    {
        var group = await db.TeachingGroups.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == teachingGroupId && x.IsActive, cancellationToken);
        if (group is null) return false;

        if (group.CurriculumId.HasValue)
        {
            if (group.CurriculumId.Value != curriculumId ||
                group.YearOfStudy != yearOfStudy ||
                !group.SemesterId.HasValue ||
                !group.ProgrammeId.HasValue)
                return false;

            return await (
                from curriculum in db.Curricula.AsNoTracking()
                join programme in db.Programmes.AsNoTracking() on curriculum.ProgrammeId equals programme.Id
                join semester in db.Semesters.AsNoTracking() on group.SemesterId.Value equals semester.Id
                join mapping in db.CurriculumCourses.AsNoTracking() on curriculum.Id equals mapping.CurriculumId
                join course in db.Courses.AsNoTracking() on mapping.CourseId equals course.Id
                where curriculum.Id == curriculumId &&
                    curriculum.ProgrammeId == group.ProgrammeId.Value &&
                    curriculum.IsActive && !curriculum.IsDeleted &&
                    programme.IsActive && !programme.IsReferenceOnly &&
                    semester.IsActive && semester.Sequence == curriculumSemesterNumber &&
                    mapping.YearOfStudy == yearOfStudy &&
                    mapping.SemesterNumber == curriculumSemesterNumber &&
                    mapping.CourseId == courseId && !mapping.IsDeleted &&
                    course.IsActive && !course.IsDeleted
                select mapping.Id).AnyAsync(cancellationToken);
        }

        return await (from teachingGroup in db.TeachingGroups.AsNoTracking()
            join offering in db.CourseOfferings.AsNoTracking() on teachingGroup.CourseOfferingId equals offering.Id
            join programme in db.Programmes.AsNoTracking() on offering.ProgrammeId equals programme.Id
            join curriculum in db.Curricula.AsNoTracking() on offering.ProgrammeId equals curriculum.ProgrammeId
            join mapping in db.CurriculumCourses.AsNoTracking() on curriculum.Id equals mapping.CurriculumId
            join course in db.Courses.AsNoTracking() on mapping.CourseId equals course.Id
            where teachingGroup.Id == teachingGroupId && teachingGroup.IsActive && offering.IsActive &&
                programme.IsActive && !programme.IsReferenceOnly && course.IsActive &&
                offering.CourseId == courseId && mapping.CourseId == courseId && curriculum.IsActive &&
                curriculum.Id == curriculumId && mapping.YearOfStudy == yearOfStudy && mapping.SemesterNumber == curriculumSemesterNumber
            select mapping.Id).AnyAsync(cancellationToken);
    }

    [HttpPost]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Create(CreateTimetableEntryRequest request, CancellationToken cancellationToken)
    {
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == request.TeachingGroupId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teaching group not found." });
        if (!await IsCourseMappedToTeachingGroupAsync(request.TeachingGroupId, request.CourseId, request.CurriculumId, request.YearOfStudy, request.CurriculumSemesterNumber, cancellationToken))
            return BadRequest(new { message = "The selected course is not mapped to the programme curriculum for this teaching group." });
        if (!await db.StaffMembers.AnyAsync(x => x.Id == request.TeacherId && x.IsActive && x.EmploymentStatus == "Active", cancellationToken)) return BadRequest(new { message = "Teacher not found." });

        var roomConflict = await repository.HasRoomConflictAsync(request.DayOfWeek, request.StartTime, request.EndTime, request.Room, cancellationToken: cancellationToken);
        if (roomConflict) return Conflict(new { message = "The room is already booked for an overlapping session." });

        var teacherConflict = await repository.HasTeacherConflictAsync(request.TeacherId, request.DayOfWeek, request.StartTime, request.EndTime, cancellationToken: cancellationToken);
        if (teacherConflict) return Conflict(new { message = "The teacher is already scheduled for an overlapping session." });

        var groupConflict = await repository.HasGroupConflictAsync(request.TeachingGroupId, request.DayOfWeek, request.StartTime, request.EndTime, cancellationToken: cancellationToken);
        if (groupConflict) return Conflict(new { message = "The teaching group already has an overlapping session." });

        var entry = new Domain.Academic.TimetableEntry { TeachingGroupId = request.TeachingGroupId, CourseId = request.CourseId, TeacherId = request.TeacherId, StaffMemberId = request.TeacherId, DayOfWeek = request.DayOfWeek, StartTime = request.StartTime, EndTime = request.EndTime, Room = request.Room, SessionType = request.SessionType };
        db.TimetableEntries.Add(entry);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/timetable/{entry.Id}", ToDto(entry));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Update(Guid id, CreateTimetableEntryRequest request, CancellationToken cancellationToken)
    {
        var existing = await db.TimetableEntries.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (existing is null) return NotFound(new { message = "Timetable session was not found or has already changed." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == request.TeachingGroupId && x.IsActive, cancellationToken)) return BadRequest(new { message = "Teaching group not found." });
        if (!await IsCourseMappedToTeachingGroupAsync(request.TeachingGroupId, request.CourseId, request.CurriculumId, request.YearOfStudy, request.CurriculumSemesterNumber, cancellationToken))
            return BadRequest(new { message = "The selected course is not mapped to the programme curriculum for this teaching group." });
        if (!await db.StaffMembers.AnyAsync(x => x.Id == request.TeacherId && x.IsActive && x.EmploymentStatus == "Active", cancellationToken)) return BadRequest(new { message = "Teacher not found." });

        var roomConflict = await repository.HasRoomConflictAsync(request.DayOfWeek, request.StartTime, request.EndTime, request.Room, excludeEntryId: id, cancellationToken: cancellationToken);
        if (roomConflict) return Conflict(new { message = "The room is already booked for an overlapping session." });

        var teacherConflict = await repository.HasTeacherConflictAsync(request.TeacherId, request.DayOfWeek, request.StartTime, request.EndTime, excludeEntryId: id, cancellationToken: cancellationToken);
        if (teacherConflict) return Conflict(new { message = "The teacher is already scheduled for an overlapping session." });

        var groupConflict = await repository.HasGroupConflictAsync(request.TeachingGroupId, request.DayOfWeek, request.StartTime, request.EndTime, excludeEntryId: id, cancellationToken: cancellationToken);
        if (groupConflict) return Conflict(new { message = "The teaching group already has an overlapping session." });

        // Timetable fields are immutable in the domain model, so replace the row atomically.
        existing.IsActive = false;
        var updated = new Domain.Academic.TimetableEntry
        {
            TeachingGroupId = request.TeachingGroupId,
            CourseId = request.CourseId,
            TeacherId = request.TeacherId,
            StaffMemberId = request.TeacherId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Room = request.Room,
            SessionType = request.SessionType,
            GenerationSource = "TemplateEditor"
        };
        db.TimetableEntries.Add(updated);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(updated));
    }


    [HttpGet("template/{teachingGroupId:guid}")]
    [Authorize(Policy = TimetablePolicies.Read)]
    public async Task<IActionResult> GetTemplate(Guid teachingGroupId, CancellationToken cancellationToken)
    {
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == teachingGroupId, cancellationToken))
            return NotFound(new { message = "Teaching group not found." });

        var template = await db.TimetableTemplates.AsNoTracking()
            .SingleOrDefaultAsync(x => x.TeachingGroupId == teachingGroupId, cancellationToken);
        return Ok(template is null
            ? new { teachingGroupId, layoutJson = (string?)null, updatedAtUtc = (DateTimeOffset?)null }
            : new { teachingGroupId, layoutJson = (string?)template.LayoutJson, updatedAtUtc = (DateTimeOffset?)template.UpdatedAtUtc });
    }

    [HttpPut("template/{teachingGroupId:guid}")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> SaveTemplate(Guid teachingGroupId, SaveTimetableTemplateRequest request, CancellationToken cancellationToken)
    {
        if (request.TeachingGroupId != teachingGroupId)
            return BadRequest(new { message = "The template class does not match the route." });
        if (!await db.TeachingGroups.AnyAsync(x => x.Id == teachingGroupId && x.IsActive, cancellationToken))
            return BadRequest(new { message = "Teaching group not found." });

        var proposed = request.Entries ?? [];
        foreach (var entry in proposed)
        {
            if (!await IsCourseMappedToTeachingGroupAsync(teachingGroupId, entry.CourseId, entry.CurriculumId, entry.YearOfStudy, entry.CurriculumSemesterNumber, cancellationToken))
                return BadRequest(new { message = "A selected course is not mapped to the programme curriculum for this teaching group." });
            if (!await db.StaffMembers.AnyAsync(x => x.Id == entry.TeacherId && x.IsActive && x.EmploymentStatus == "Active", cancellationToken))
                return BadRequest(new { message = "A selected teacher was not found or is inactive." });
        }

        for (var i = 0; i < proposed.Count; i++)
        {
            for (var j = i + 1; j < proposed.Count; j++)
            {
                if (HasOverlap(proposed[i], proposed[j]))
                    return Conflict(new { message = "The template contains overlapping class, teacher, or room assignments." });
            }
        }

        var existingOtherGroups = await db.TimetableEntries.AsNoTracking()
            .Where(x => x.IsActive && x.TeachingGroupId != teachingGroupId)
            .ToListAsync(cancellationToken);
        if (proposed.Any(item => existingOtherGroups.Any(other => HasOverlap(item, other))))
            return Conflict(new { message = "The template conflicts with another class, teacher, or room already scheduled." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var oldEntries = await db.TimetableEntries
            .Where(x => x.IsActive && x.TeachingGroupId == teachingGroupId)
            .ToListAsync(cancellationToken);
        foreach (var old in oldEntries) old.IsActive = false;

        var replacement = proposed.Select(item => new Domain.Academic.TimetableEntry
        {
            TeachingGroupId = teachingGroupId,
            CourseId = item.CourseId,
            TeacherId = item.TeacherId,
            StaffMemberId = item.TeacherId,
            DayOfWeek = item.DayOfWeek,
            StartTime = item.StartTime,
            EndTime = item.EndTime,
            Room = string.IsNullOrWhiteSpace(item.Room) ? null : item.Room.Trim(),
            SessionType = item.SessionType,
            GenerationSource = "TemplateEditor"
        }).ToList();
        db.TimetableEntries.AddRange(replacement);
        if (!string.IsNullOrWhiteSpace(request.LayoutJson))
        {
            var savedLayout = await db.TimetableTemplates
                .SingleOrDefaultAsync(x => x.TeachingGroupId == teachingGroupId, cancellationToken);
            if (savedLayout is null)
            {
                db.TimetableTemplates.Add(new Domain.Academic.TimetableTemplate
                {
                    TeachingGroupId = teachingGroupId,
                    LayoutJson = request.LayoutJson,
                    UpdatedAtUtc = DateTimeOffset.UtcNow
                });
            }
            else
            {
                savedLayout.LayoutJson = request.LayoutJson;
                savedLayout.UpdatedAtUtc = DateTimeOffset.UtcNow;
            }
        }
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(replacement.Select(ToDto).ToArray());
    }

    private static string[] ParseCourseUnitIds(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return [];
        try
        {
            return JsonSerializer.Deserialize<string[]>(value) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static TimetableEntryDto ToDto(Domain.Academic.TimetableEntry entry) =>
        new(entry.Id, entry.TeachingGroupId, entry.CourseId, entry.TeacherId, entry.DayOfWeek,
            entry.StartTime, entry.EndTime, entry.Room, entry.SessionType, entry.IsActive,
            entry.GeneratedAt, entry.GenerationSource);

    private static bool HasOverlap(Domain.Academic.TimetableEntry left, Domain.Academic.TimetableEntry right)
    {
        if (left.DayOfWeek != right.DayOfWeek || left.StartTime >= right.EndTime || right.StartTime >= left.EndTime)
            return false;
        var sameClass = left.TeachingGroupId == right.TeachingGroupId;
        var sameTeacher = left.TeacherId == right.TeacherId;
        var sameRoom = !string.IsNullOrWhiteSpace(left.Room) && !string.IsNullOrWhiteSpace(right.Room)
            && string.Equals(left.Room.Trim(), right.Room.Trim(), StringComparison.OrdinalIgnoreCase);
        return sameClass || sameTeacher || sameRoom;
    }

    private static bool HasOverlap(CreateTimetableEntryRequest left, CreateTimetableEntryRequest right)
    {
        if (left.DayOfWeek != right.DayOfWeek || left.StartTime >= right.EndTime || right.StartTime >= left.EndTime)
            return false;
        var sameClass = left.TeachingGroupId == right.TeachingGroupId;
        var sameTeacher = left.TeacherId == right.TeacherId;
        var sameRoom = !string.IsNullOrWhiteSpace(left.Room) && !string.IsNullOrWhiteSpace(right.Room)
            && string.Equals(left.Room.Trim(), right.Room.Trim(), StringComparison.OrdinalIgnoreCase);
        return sameClass || sameTeacher || sameRoom;
    }

    private static bool HasOverlap(CreateTimetableEntryRequest proposed, Domain.Academic.TimetableEntry existing)
    {
        if (proposed.DayOfWeek != existing.DayOfWeek || proposed.StartTime >= existing.EndTime || existing.StartTime >= proposed.EndTime)
            return false;
        var sameClass = proposed.TeachingGroupId == existing.TeachingGroupId;
        var sameTeacher = proposed.TeacherId == existing.TeacherId;
        var sameRoom = !string.IsNullOrWhiteSpace(proposed.Room) && !string.IsNullOrWhiteSpace(existing.Room)
            && string.Equals(proposed.Room.Trim(), existing.Room.Trim(), StringComparison.OrdinalIgnoreCase);
        return sameClass || sameTeacher || sameRoom;
    }

    [HttpPost("generate")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Generate(GenerateTimetableRequest request, CancellationToken cancellationToken)
    {
        var result = await generator.GenerateAsync(request, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = TimetablePolicies.Management)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var entry = await db.TimetableEntries.SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (entry is null) return NotFound();
        entry.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record CreateTimetableEntryRequest(Guid TeachingGroupId, Guid CourseId, Guid TeacherId, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime, string? Room, string? SessionType, Guid CurriculumId, int YearOfStudy, int CurriculumSemesterNumber);
public sealed record SaveTimetableTemplateRequest(Guid TeachingGroupId, List<CreateTimetableEntryRequest> Entries, string? LayoutJson = null);
