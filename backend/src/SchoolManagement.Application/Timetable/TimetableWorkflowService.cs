using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Timetable;

/// <summary>
/// Application-level timetable workflow validation and domain-object creation.
/// Persistence and conflict checks remain the responsibility of the timetable repository/API boundary.
/// </summary>
public sealed class TimetableWorkflowService
{
    public TimetableEntry CreateEntry(
        Guid teachingGroupId,
        DayOfWeek dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string? room = null,
        string? sessionType = null)
    {
        if (teachingGroupId == Guid.Empty)
            throw new ArgumentException("A teaching group is required.", nameof(teachingGroupId));

        if (endTime <= startTime)
            throw new ArgumentException("End time must be after start time.", nameof(endTime));

        return new TimetableEntry
        {
            TeachingGroupId = teachingGroupId,
            DayOfWeek = dayOfWeek,
            StartTime = startTime,
            EndTime = endTime,
            Room = NormalizeOptional(room),
            SessionType = NormalizeOptional(sessionType),
            IsActive = true
        };
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
