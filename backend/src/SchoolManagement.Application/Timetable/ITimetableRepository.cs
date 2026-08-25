using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Timetable;

public interface ITimetableRepository
{
    Task<IReadOnlyList<TimetableEntry>> GetActiveAsync(
        Guid? teachingGroupId = null,
        CancellationToken cancellationToken = default);

    Task<TimetableEntry?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<bool> HasRoomConflictAsync(
        DayOfWeek dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string? room,
        Guid? excludeEntryId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(TimetableEntry entry, CancellationToken cancellationToken = default);

    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
