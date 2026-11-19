namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Defines an elective group within a curriculum semester: students must choose
/// a minimum number of courses from a pool of options.
/// </summary>
public sealed class ElectiveGroup
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; set; }
    public int YearOfStudy { get; set; }
    public int SemesterNumber { get; set; }
    public required string Title { get; set; }
    public int MinCredits { get; set; } = 0;
    public int MinCourses { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Links a specific course to an elective group.
/// </summary>
public sealed class ElectiveGroupCourse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ElectiveGroupId { get; set; }
    public Guid CourseId { get; set; }
    public bool IsCoreWithinGroup { get; set; } = false;
}

/// <summary>
/// Defines a prerequisite relationship between two courses.
/// </summary>
public sealed class CoursePrerequisite
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid PrerequisiteCourseId { get; set; }
    public bool IsMandatory { get; set; } = true;
    public string? MinimumGrade { get; set; }
}

/// <summary>
/// Tracks curriculum versions for diff, clone, and governance purposes.
/// </summary>
public sealed class CurriculumVersion
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumId { get; set; }
    public required string Version { get; set; }
    public required string Title { get; set; }
    public int MinimumCredits { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public ProgrammeType ProgrammeType { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedBy { get; set; }
    public string? ChangeNotes { get; set; }
}

/// <summary>
/// Snapshot of a curriculum course mapping at a specific version, for diffing.
/// </summary>
public sealed class CurriculumVersionCourse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CurriculumVersionId { get; set; }
    public Guid CourseId { get; set; }
    public int YearOfStudy { get; set; }
    public int SemesterNumber { get; set; }
    public bool IsCore { get; set; }
    public Guid? ElectiveGroupId { get; set; }
}

/// <summary>
/// Maps an external course (transfer credit) to an internal curriculum course.
/// </summary>
public sealed class CourseEquivalence
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string ExternalCourseCode { get; set; }
    public required string ExternalCourseName { get; set; }
    public required string ExternalInstitution { get; set; }
    public Guid InternalCourseId { get; set; }
    public int CreditsAccepted { get; set; }
    public bool IsMandatory { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedBy { get; set; }
}

/// <summary>
/// Records that a student has been granted transfer credit for a specific equivalence.
/// </summary>
public sealed class StudentTransferCredit
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid CourseEquivalenceId { get; set; }
    public Guid SemesterId { get; set; }
    public required string ExternalTranscriptRef { get; set; }
    public DateTimeOffset GrantedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? GrantedBy { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Programme-level learning outcome that courses contribute to.
/// </summary>
public sealed class ProgrammeLearningOutcome
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ProgrammeId { get; set; }
    public required string Code { get; set; }
    public required string Description { get; set; }
    public int Sequence { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Maps a course to the programme learning outcomes it contributes to, with a contribution level.
/// </summary>
public sealed class CoursePloMapping
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public Guid ProgrammeLearningOutcomeId { get; set; }
    public required string ContributionLevel { get; set; } // "Introductory", "Reinforcing", "Mastery"
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Tracks LMS (Learning Management System) course shell creation for curriculum courses.
/// </summary>
public sealed class LmsCourse
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public required string LmsPlatform { get; set; } // "Moodle", "Canvas", "GoogleClassroom"
    public required string LmsCourseId { get; set; } // External LMS course identifier
    public required string LmsCourseUrl { get; set; }
    public string Status { get; set; } = "Created";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public string? CreatedBy { get; set; }
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Records imports from external regulators (UHPAB, UVTAB, etc.).
/// </summary>
public sealed class RegulatorImport
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string RegulatorCode { get; set; } // "UHPAB", "UVTAB", "SCHOOL_BASED"
    public required string ImportType { get; set; } // "Courses", "Curriculum", "FeeReferences"
    public DateTimeOffset ImportedAt { get; set; } = DateTimeOffset.UtcNow;
    public int RecordsProcessed { get; set; }
    public int RecordsInserted { get; set; }
    public int RecordsSkipped { get; set; }
    public string? ImportFileRef { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
}
