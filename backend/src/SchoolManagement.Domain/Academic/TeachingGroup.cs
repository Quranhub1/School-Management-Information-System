namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Delivery group/stream for students taking a course offering.
/// </summary>
public sealed class TeachingGroup
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CourseOfferingId { get; init; }
    public required string GroupCode { get; init; }
    public string? Name { get; init; }
    public int? Capacity { get; init; }
    public bool IsActive { get; set; } = true;
}
