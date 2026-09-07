namespace SchoolManagement.Domain.Academic;

/// <summary>
/// A scheduled teaching session for a teaching group.
/// </summary>
public sealed class TimetableEntry
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid TeachingGroupId { get; init; }
    public Guid CourseId { get; init; }
    public Guid TeacherId { get; init; }
    public DayOfWeek DayOfWeek { get; init; }
    public TimeOnly StartTime { get; init; }
    public TimeOnly EndTime { get; init; }
    public string? Room { get; init; }
    public string? SessionType { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? GeneratedAt { get; set; }
    public string? GenerationSource { get; set; }
}
