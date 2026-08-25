using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Timetable;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class TimetableRepository(SchoolManagementDbContext db) : ITimetableRepository
{
    public async Task<IReadOnlyList<TimetableEntry>> GetActiveAsync(
        Guid? teachingGroupId = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.TimetableEntries
            .AsNoTracking()
            .Where(x => x.IsActive);

        if (teachingGroupId.HasValue)
            query = query.Where(x => x.TeachingGroupId == teachingGroupId.Value);

        return await query
            .OrderBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .ToListAsync(cancellationToken);
    }

    public Task<TimetableEntry?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        db.TimetableEntries.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<bool> HasRoomConflictAsync(
        DayOfWeek dayOfWeek,
        TimeOnly startTime,
        TimeOnly endTime,
        string? room,
        Guid? excludeEntryId = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(room))
            return false;

        var normalizedRoom = room.Trim();
        var query = db.TimetableEntries
            .AsNoTracking()
            .Where(x => x.IsActive
                && x.DayOfWeek == dayOfWeek
                && x.Room != null
                && x.Room == normalizedRoom
                && x.StartTime < endTime
                && startTime < x.EndTime);

        if (excludeEntryId.HasValue)
            query = query.Where(x => x.Id != excludeEntryId.Value);

        return await query.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(TimetableEntry entry, CancellationToken cancellationToken = default) =>
        await db.TimetableEntries.AddAsync(entry, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
