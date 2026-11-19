namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Saved timetable editor layout for a teaching group. Lesson assignments remain
/// normalized in TimetableEntries; this record preserves empty periods and grid layout.
/// </summary>
public sealed class TimetableTemplate
{
    public Guid TeachingGroupId { get; set; }
    public string LayoutJson { get; set; } = "{}";
    public DateTimeOffset UpdatedAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
