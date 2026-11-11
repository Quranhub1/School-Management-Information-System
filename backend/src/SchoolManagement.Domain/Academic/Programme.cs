namespace SchoolManagement.Domain.Academic;

public enum ProgrammeType
{
    FullProgramme = 0,
    ShortCourse = 1
}

public sealed class Programme
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid? DepartmentId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string Award { get; set; }
    public string? AwardTitle { get; set; }
    public int DurationYears { get; set; }
    public string DurationUnit { get; set; } = "Years";
    public string StudyMode { get; set; } = "Full-time";
    public string DeliveryType { get; set; } = "Academic";
    public ProgrammeType Type { get; set; } = ProgrammeType.FullProgramme;
    public string? Regulator { get; set; }
    public string? ApprovalReference { get; set; }
    public DateOnly? ApprovalDate { get; set; }
    public string ApprovalStatus { get; set; } = "NeedsVerification";
    public string? SourceReference { get; set; }
    public bool IsReferenceOnly { get; set; }
    public bool IsActive { get; set; } = true;
}
