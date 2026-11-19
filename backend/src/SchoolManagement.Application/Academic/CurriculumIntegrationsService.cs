using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Academic;

public sealed record GraduationAuditResult(
    Guid StudentId,
    string StudentNumber,
    string FirstName,
    string LastName,
    Guid ProgrammeId,
    string ProgrammeCode,
    string ProgrammeName,
    int TotalRequiredCredits,
    int TotalEarnedCredits,
    int TotalMandatoryCourses,
    int TotalMandatoryCompleted,
    bool IsEligibleForGraduation,
    List<string> MissingCourses,
    List<string> MissingElectiveGroups);

public sealed class GraduationAuditService(
    ICurriculumRepository curricula,
    ICurriculumCourseRepository curriculumCourses,
    ICourseRepository courses,
    IProgrammeRepository programmes)
{
    public async Task<GraduationAuditResult?> AuditAsync(Guid studentId, CancellationToken ct = default)
    {
        return null;
    }

    public async Task<IReadOnlyList<GraduationAuditResult>> AuditProgrammeAsync(Guid programmeId, CancellationToken ct = default)
    {
        return [];
    }
}

public sealed record TimetableLinkResult(Guid TimetableEntryId, Guid CourseOfferingId, Guid TeachingGroupId, string Room, DayOfWeek DayOfWeek, TimeOnly StartTime, TimeOnly EndTime);

public sealed class TimetableLinkingService(
    ICurriculumCourseRepository curriculumCourses,
    ICourseRepository courses)
{
    public async Task<IReadOnlyList<TimetableLinkResult>> GetLinksForCurriculumAsync(Guid curriculumId, CancellationToken ct = default)
    {
        return [];
    }

    public async Task<(bool Success, string? Error)> ValidateLinkAsync(Guid curriculumId, Guid courseId, Guid semesterId, CancellationToken ct = default)
    {
        var mapping = await curriculumCourses.ExistsAsync(curriculumId, courseId, ct);
        if (!mapping) return (false, "Course is not mapped to this curriculum.");
        return (true, null);
    }
}

public sealed record CreateElectiveGroupRequest(Guid CurriculumId, int YearOfStudy, int SemesterNumber, string Title, int MinCredits, int MinCourses);
public sealed record AddElectiveGroupCourseRequest(Guid ElectiveGroupId, Guid CourseId, bool IsCoreWithinGroup);

public sealed class ElectiveGroupService(
    IElectiveGroupRepository groups,
    ICourseRepository courses,
    ICurriculumRepository curricula)
{
    public async Task<IReadOnlyList<ElectiveGroup>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) =>
        await groups.GetByCurriculumAsync(curriculumId, ct);

    public async Task<(bool Success, string? Error, Guid? GroupId)> CreateAsync(CreateElectiveGroupRequest request, CancellationToken ct = default)
    {
        var curriculum = await curricula.GetByIdAsync(request.CurriculumId, ct);
        if (curriculum is null) return (false, "Curriculum not found.", default(Guid?));
        if (await groups.ExistsAsync(request.CurriculumId, request.YearOfStudy, request.SemesterNumber, ct))
            return (false, "An elective group already exists for this year/semester.", default(Guid?));

        var group = new ElectiveGroup
        {
            CurriculumId = request.CurriculumId,
            YearOfStudy = request.YearOfStudy,
            SemesterNumber = request.SemesterNumber,
            Title = request.Title,
            MinCredits = request.MinCredits,
            MinCourses = request.MinCourses
        };
        await groups.AddAsync(group, ct);
        await groups.SaveChangesAsync(ct);
        return (true, null, group.Id);
    }

    public async Task<(bool Success, string? Error)> AddCourseAsync(AddElectiveGroupCourseRequest request, CancellationToken ct = default)
    {
        var course = await courses.GetByIdAsync(request.CourseId, ct);
        if (course is null) return (false, "Course not found.");
        await groups.AddCourseAsync(new ElectiveGroupCourse
        {
            ElectiveGroupId = request.ElectiveGroupId,
            CourseId = request.CourseId,
            IsCoreWithinGroup = request.IsCoreWithinGroup
        }, ct);
        await groups.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error)> RemoveCourseAsync(Guid groupCourseId, CancellationToken ct = default)
    {
        await groups.RemoveCourseAsync(groupCourseId, ct);
        await groups.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<bool> RemoveGroupAsync(Guid groupId, CancellationToken ct = default)
    {
        await groups.RemoveAsync(groupId, ct);
        await groups.SaveChangesAsync(ct);
        return true;
    }
}

public sealed record CurriculumVersionSnapshot(Guid VersionId, Guid CurriculumId, string Version, string Title, int MinimumCredits, List<CurriculumVersionCourseDto> Courses);
public sealed record CurriculumVersionCourseDto(Guid CourseId, string CourseCode, string CourseName, int YearOfStudy, int SemesterNumber, bool IsCore, Guid? ElectiveGroupId);

public sealed class CurriculumVersionService(
    ICurriculumVersionRepository versions,
    ICurriculumRepository curricula,
    ICurriculumCourseRepository mappings,
    ICourseRepository courses)
{
    public async Task<IReadOnlyList<CurriculumVersion>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) =>
        await versions.GetByCurriculumAsync(curriculumId, ct);

    public async Task<(bool Success, string? Error, Guid? VersionId)> CreateSnapshotAsync(Guid curriculumId, string version, string title, string? changeNotes, CancellationToken ct = default)
    {
        var curriculum = await curricula.GetByIdAsync(curriculumId, ct);
        if (curriculum is null) return (false, "Curriculum not found.");

        var cv = new CurriculumVersion
        {
            CurriculumId = curriculumId,
            Version = version,
            Title = title,
            MinimumCredits = curriculum.MinimumCredits,
            EffectiveFrom = curriculum.EffectiveFrom,
            EffectiveTo = curriculum.EffectiveTo,
            ProgrammeType = curriculum.ProgrammeType,
            Status = curriculum.Status,
            CreatedBy = changeNotes,
            ChangeNotes = changeNotes
        };
        await versions.AddAsync(cv, ct);
        await versions.SaveChangesAsync(ct);

        var existingMappings = await mappings.GetByCurriculumAsync(curriculumId, ct);
        foreach (var m in existingMappings)
        {
            var course = await courses.GetByIdAsync(m.CourseId, ct);
            await versions.AddCourseAsync(new CurriculumVersionCourse
            {
                CurriculumVersionId = cv.Id,
                CourseId = m.CourseId,
                YearOfStudy = m.YearOfStudy,
                SemesterNumber = m.SemesterNumber,
                IsCore = m.IsCore
            }, ct);
        }
        await versions.SaveChangesAsync(ct);
        return (true, null, cv.Id);
    }

    public async Task<IReadOnlyList<CurriculumVersionCourseDto>> GetCoursesByVersionAsync(Guid versionId, CancellationToken ct = default)
    {
        var versionCourses = await versions.GetCoursesByVersionAsync(versionId, ct);
        var result = new List<CurriculumVersionCourseDto>();
        foreach (var vc in versionCourses)
        {
            var course = await courses.GetByIdAsync(vc.CourseId, ct);
            result.Add(new CurriculumVersionCourseDto(
                vc.CourseId, course?.Code ?? "Unknown", course?.Name ?? "Unknown",
                vc.YearOfStudy, vc.SemesterNumber, vc.IsCore, vc.ElectiveGroupId));
        }
        return result;
    }

    public async Task<(bool Success, string? Error)> CloneCurriculumAsync(Guid sourceCurriculumId, Guid targetCurriculumId, CancellationToken ct = default)
    {
        var source = await curricula.GetByIdAsync(sourceCurriculumId, ct);
        var target = await curricula.GetByIdAsync(targetCurriculumId, ct);
        if (source is null || target is null) return (false, "Source or target curriculum not found.");

        var sourceMappings = await mappings.GetByCurriculumAsync(sourceCurriculumId, ct);
        foreach (var m in sourceMappings)
        {
            var exists = await mappings.ExistsAsync(targetCurriculumId, m.CourseId, ct);
            if (!exists)
            {
                await mappings.AddAsync(new CurriculumCourse
                {
                    CurriculumId = targetCurriculumId,
                    CourseId = m.CourseId,
                    YearOfStudy = m.YearOfStudy,
                    SemesterNumber = m.SemesterNumber,
                    IsCore = m.IsCore
                }, ct);
            }
        }
        await mappings.SaveChangesAsync(ct);
        return (true, null);
    }

    public async Task<(bool Success, string? Error, List<string> Differences)> DiffAsync(Guid versionAId, Guid versionBId, CancellationToken ct = default)
    {
        var coursesA = await GetCoursesByVersionAsync(versionAId, ct);
        var coursesB = await GetCoursesByVersionAsync(versionBId, ct);
        var differences = new List<string>();

        var aByCourse = coursesA.ToDictionary(c => c.CourseId);
        var bByCourse = coursesB.ToDictionary(c => c.CourseId);

        foreach (var c in coursesA)
        {
            if (!bByCourse.TryGetValue(c.CourseId, out var b))
                differences.Add($"Course {c.CourseCode} removed in version B");
            else if (c.YearOfStudy != b.YearOfStudy || c.SemesterNumber != b.SemesterNumber || c.IsCore != b.IsCore)
                differences.Add($"Course {c.CourseCode} changed placement/core status");
        }
        foreach (var c in coursesB)
        {
            if (!aByCourse.ContainsKey(c.CourseId))
                differences.Add($"Course {c.CourseCode} added in version B");
        }
        return (true, null, differences);
    }
}

public sealed record FacultyAssignmentRequest(Guid OfferingId, Guid StaffMemberId);
public sealed class FacultyAssignmentService(ICourseRepository courses)
{
    public async Task<(bool Success, string? Error)> AssignFacultyAsync(Guid offeringId, Guid staffMemberId, CancellationToken ct = default)
    {
        var course = await courses.GetByIdAsync(offeringId, ct);
        if (course is null) return (false, "Course offering not found.");
        return (true, null);
    }
}

public sealed record FeeCalculationResult(Guid StudentId, Guid ProgrammeId, int TotalCredits, decimal FeePerCredit, decimal TotalFee, List<FeeLineItem> LineItems);
public sealed record FeeLineItem(string Description, int Credits, decimal Rate, decimal Amount);

public sealed class FeeIntegrationService(
    ICurriculumCourseRepository curriculumCourses,
    ICourseRepository courses)
{
    public async Task<FeeCalculationResult> CalculateFeesAsync(Guid studentId, Guid curriculumId, Guid semesterId, decimal feePerCredit, CancellationToken ct = default)
    {
        var mappings = await curriculumCourses.GetByCurriculumAsync(curriculumId, ct);
        int totalCredits = 0;
        var lineItems = new List<FeeLineItem>();
        foreach (var m in mappings)
        {
            var course = await courses.GetByIdAsync(m.CourseId, ct);
            if (course is null) continue;
            totalCredits += course.CreditUnits;
            lineItems.Add(new FeeLineItem(course.Code, course.CreditUnits, feePerCredit, course.CreditUnits * feePerCredit));
        }
        return new FeeCalculationResult(studentId, curriculumId, totalCredits, feePerCredit, totalCredits * feePerCredit, lineItems);
    }
}

public sealed class PrerequisiteChainService(ICoursePrerequisiteRepository prerequisites, ICourseRepository courses)
{
    public async Task<bool> ValidateChainAsync(Guid courseId, CancellationToken ct = default)
    {
        var visited = new HashSet<Guid>();
        return await ValidateChainRecursiveAsync(courseId, visited, ct);
    }

    private async Task<bool> ValidateChainRecursiveAsync(Guid courseId, HashSet<Guid> visited, CancellationToken ct)
    {
        if (!visited.Add(courseId)) return false;
        var prereqs = await prerequisites.GetByCourseAsync(courseId, ct);
        foreach (var p in prereqs.Where(p => p.IsMandatory))
        {
            var prereqCourse = await courses.GetByIdAsync(p.PrerequisiteCourseId, ct);
            if (prereqCourse == null) return false;
            if (!await ValidateChainRecursiveAsync(p.PrerequisiteCourseId, visited, ct)) return false;
        }
        return true;
    }

    public async Task<IReadOnlyList<Guid>> GetTransitivePrerequisitesAsync(Guid courseId, CancellationToken ct = default)
    {
        var result = new List<Guid>();
        var visited = new HashSet<Guid>();
        await CollectTransitiveAsync(courseId, visited, result, ct);
        return result;
    }

    private async Task CollectTransitiveAsync(Guid courseId, HashSet<Guid> visited, List<Guid> result, CancellationToken ct)
    {
        if (!visited.Add(courseId)) return;
        var prereqs = await prerequisites.GetByCourseAsync(courseId, ct);
        foreach (var p in prereqs)
        {
            result.Add(p.PrerequisiteCourseId);
            await CollectTransitiveAsync(p.PrerequisiteCourseId, visited, result, ct);
        }
    }
}

public sealed record CourseEquivalenceDto(Guid Id, string ExternalCourseCode, string ExternalCourseName, string ExternalInstitution, Guid InternalCourseId, string InternalCourseCode, string InternalCourseName, int CreditsAccepted, bool IsMandatory, bool IsActive);

public sealed class CourseEquivalenceService(
    ICourseEquivalenceRepository equivalences,
    ICourseRepository courses)
{
    public async Task<IReadOnlyList<CourseEquivalenceDto>> GetAllAsync(CancellationToken ct = default)
    {
        var allEquivalences = await equivalences.GetAllAsync(ct);
        var result = new List<CourseEquivalenceDto>();
        foreach (var e in allEquivalences)
        {
            var internalCourse = await courses.GetByIdAsync(e.InternalCourseId, ct);
            result.Add(new CourseEquivalenceDto(
                e.Id, e.ExternalCourseCode, e.ExternalCourseName, e.ExternalInstitution,
                e.InternalCourseId, internalCourse?.Code ?? "Unknown", internalCourse?.Name ?? "Unknown",
                e.CreditsAccepted, e.IsMandatory, e.IsActive));
        }
        return result;
    }

    public async Task<(bool Success, string? Error)> AddAsync(string externalCourseCode, string externalCourseName, string externalInstitution, Guid internalCourseId, int creditsAccepted, bool isMandatory, CancellationToken ct = default)
    {
        if (await equivalences.ExistsAsync(externalCourseCode, ct))
            return (false, "Equivalence already exists.");
        var course = await courses.GetByIdAsync(internalCourseId, ct);
        if (course is null) return (false, "Internal course not found.");
        await equivalences.AddAsync(new CourseEquivalence
        {
            ExternalCourseCode = externalCourseCode,
            ExternalCourseName = externalCourseName,
            ExternalInstitution = externalInstitution,
            InternalCourseId = internalCourseId,
            CreditsAccepted = creditsAccepted,
            IsMandatory = isMandatory
        }, ct);
        await equivalences.SaveChangesAsync(ct);
        return (true, null);
    }
}

public sealed record ProgrammeLearningOutcomeDto(Guid Id, Guid ProgrammeId, string Code, string Description, int Sequence, bool IsActive);

public sealed class ProgrammeLearningOutcomeService(
    IProgrammeLearningOutcomeRepository plos,
    ICourseRepository courses)
{
    public async Task<IReadOnlyList<ProgrammeLearningOutcomeDto>> GetByProgrammeAsync(Guid programmeId, CancellationToken ct = default) =>
        (await plos.GetByProgrammeAsync(programmeId, ct))
        .Select(p => new ProgrammeLearningOutcomeDto(p.Id, p.ProgrammeId, p.Code, p.Description, p.Sequence, p.IsActive))
        .ToList();

    public async Task<(bool Success, string? Error)> AddAsync(Guid programmeId, string code, string description, int sequence, CancellationToken ct = default)
    {
        await plos.AddAsync(new ProgrammeLearningOutcome
        {
            ProgrammeId = programmeId,
            Code = code,
            Description = description,
            Sequence = sequence
        }, ct);
        await plos.SaveChangesAsync(ct);
        return (true, null);
    }
}

public sealed class LmsCourseService(ILmsCourseRepository lmsCourses, ICourseRepository courses)
{
    public async Task<IReadOnlyList<LmsCourse>> GetAllAsync(CancellationToken ct = default) =>
        await lmsCourses.GetAllAsync(ct);

    public async Task<(bool Success, string? Error)> CreateShellAsync(Guid courseId, string platform, string externalCourseId, string externalCourseUrl, CancellationToken ct = default)
    {
        var course = await courses.GetByIdAsync(courseId, ct);
        if (course is null) return (false, "Course not found.");
        var existing = await lmsCourses.GetByCourseAsync(courseId, ct);
        if (existing is not null) return (false, "LMS shell already exists for this course.");
        await lmsCourses.AddAsync(new LmsCourse
        {
            CourseId = courseId,
            LmsPlatform = platform,
            LmsCourseId = externalCourseId,
            LmsCourseUrl = externalCourseUrl
        }, ct);
        await lmsCourses.SaveChangesAsync(ct);
        return (true, null);
    }
}

public sealed record RegulatorImportDto(Guid Id, string RegulatorCode, string ImportType, DateTimeOffset ImportedAt, int RecordsProcessed, int RecordsInserted, int RecordsSkipped, string? Notes);

public sealed class RegulatorImportService(IRegulatorImportRepository imports)
{
    public async Task<IReadOnlyList<RegulatorImportDto>> GetAllAsync(CancellationToken ct = default) =>
        (await imports.GetAllAsync(ct))
        .Select(i => new RegulatorImportDto(i.Id, i.RegulatorCode, i.ImportType, i.ImportedAt, i.RecordsProcessed, i.RecordsInserted, i.RecordsSkipped, i.Notes))
        .ToList();

    public async Task<(bool Success, string? Error)> RecordAsync(string regulatorCode, string importType, int processed, int inserted, int skipped, string? fileRef, string? notes, CancellationToken ct = default)
    {
        await imports.AddAsync(new RegulatorImport
        {
            RegulatorCode = regulatorCode,
            ImportType = importType,
            RecordsProcessed = processed,
            RecordsInserted = inserted,
            RecordsSkipped = skipped,
            ImportFileRef = fileRef,
            Notes = notes
        }, ct);
        await imports.SaveChangesAsync(ct);
        return (true, null);
    }
}
