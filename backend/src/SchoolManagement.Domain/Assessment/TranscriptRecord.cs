namespace SchoolManagement.Domain.Assessment;

public sealed class TranscriptRecord
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentNumber { get; set; } = string.Empty;
    public string ProgrammeCode { get; set; } = string.Empty;
    public string ProgrammeName { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public IReadOnlyList<TranscriptCourseRecord> Courses { get; set; } = Array.Empty<TranscriptCourseRecord>();
    public decimal SemesterGpa { get; set; }
    public decimal Cgpa { get; set; }
    public AcademicStandingStatus AcademicStanding { get; set; }
    public bool IsFinalized { get; set; }
    public DateTime? FinalizedAt { get; set; }
}

public sealed class TranscriptCourseRecord
{
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int CreditUnits { get; set; }
    public decimal Score { get; set; }
    public string Grade { get; set; } = string.Empty;
    public decimal GradePoint { get; set; }
}
