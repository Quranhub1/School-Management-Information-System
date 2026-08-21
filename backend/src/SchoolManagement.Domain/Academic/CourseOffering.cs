namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Operational offering of a curriculum course in a specific semester.
/// </summary>
public sealed class CourseOffering
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseId { get; init; }
    public Guid SemesterId { get; init; }
    public Guid ProgrammeId { get; init; }
    public required string OfferingCode { get; init; }
    public string Status { get; set; } = "Planned";
    public int? Capacity { get; init; }
    public bool IsActive { get; set; } = true;
}
