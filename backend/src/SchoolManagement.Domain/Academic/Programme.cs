namespace SchoolManagement.Domain.Academic;

public enum ProgrammeType
{
    FullProgramme = 0,
    ShortCourse = 1
}

public sealed class Programme
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid DepartmentId { get; init; }
    public required string Code { get; init; }
    public required string Name { get; init; }
    public required string Award { get; init; }
    public string? AwardTitle { get; init; }
    public int DurationYears { get; init; }
    public string DurationUnit { get; init; } = "Years";
    public string StudyMode { get; init; } = "Full-time";
    public string DeliveryType { get; init; } = "Academic";
    public ProgrammeType Type { get; set; } = ProgrammeType.FullProgramme;
    public string? Regulator { get; init; }
    public string? ApprovalReference { get; init; }
    public DateOnly? ApprovalDate { get; init; }
    public bool IsActive { get; set; } = true;
}
