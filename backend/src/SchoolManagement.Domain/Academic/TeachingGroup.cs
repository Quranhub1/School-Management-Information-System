namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Timetable delivery group. Cohort-backed groups represent a programme, curriculum year and semester; legacy groups remain linked to one course offering.
/// </summary>
public sealed class TeachingGroup
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseOfferingId { get; init; }
    // When populated, this record represents a complete programme-year cohort for one academic semester.
    // CourseOfferingId remains as a compatibility anchor for existing timetable relationships.
    public Guid? ProgrammeId { get; init; }
    public Guid? CurriculumId { get; init; }
    public int? YearOfStudy { get; init; }
    public Guid? SemesterId { get; init; }
    public required string GroupCode { get; init; }
    public string? Name { get; init; }
    public int? Capacity { get; init; }
    public bool IsActive { get; set; } = true;
}
