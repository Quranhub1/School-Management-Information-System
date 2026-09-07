using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Timetable;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Timetable;

public sealed class TimetableGeneratorService(SchoolManagementDbContext db)
{
    private const int DefaultRotationInterval = 15;

    public async Task<GeneratedTimetableResult> GenerateAsync(GenerateTimetableRequest request, CancellationToken cancellationToken = default)
    {
        var conflicts = new List<string>();
        var warnings = new List<string>();
        var unscheduled = new List<string>();
        var generatedEntries = new List<TimetableEntry>();

        var semesterId = request.SemesterId;
        var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == semesterId, cancellationToken);
        if (semester is null)
        {
            return new GeneratedTimetableResult([], [], ["Semester not found."], 0, [], false);
        }

        var courseOfferingsQuery = db.CourseOfferings.AsNoTracking()
            .Where(x => x.SemesterId == semesterId && x.IsActive);

        if (request.TeachingGroupId.HasValue)
            courseOfferingsQuery = courseOfferingsQuery.Where(x => x.Id == request.TeachingGroupId.Value);

        var courseOfferings = await courseOfferingsQuery.ToListAsync(cancellationToken);

        var teachingGroups = await db.TeachingGroups.AsNoTracking()
            .Where(x => courseOfferings.Select(co => co.Id).Contains(x.CourseOfferingId) && x.IsActive)
            .ToListAsync(cancellationToken);

        var courses = await db.Courses.AsNoTracking()
            .Where(x => courseOfferings.Select(co => co.CourseId).Contains(x.Id))
            .ToListAsync(cancellationToken);

        var courseIds = courses.Select(c => c.Id).ToHashSet();

        var allocations = await db.TeachingAllocations.AsNoTracking()
            .Where(x => x.IsActive && courseIds.Contains(x.CourseId))
            .ToListAsync(cancellationToken);

        var teacherIds = allocations.Select(a => a.StaffMemberId).ToHashSet();
        var teachers = await db.StaffMembers.AsNoTracking()
            .Where(x => teacherIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        var rooms = await db.InstitutionSettings.AsNoTracking()
            .Where(x => x.IsActive)
            .SelectMany(x => new[] { x.LogoPath })
            .Where(x => !string.IsNullOrEmpty(x))
            .ToListAsync(cancellationToken);

        var existingEntries = await db.TimetableEntries.AsNoTracking()
            .Where(x => x.IsActive)
            .ToListAsync(cancellationToken);

        var teacherSchedules = new Dictionary<Guid, List<(DayOfWeek, TimeOnly, TimeOnly)>>();
        var roomSchedules = new Dictionary<string, List<(DayOfWeek, TimeOnly, TimeOnly)>>();
        var groupSchedules = new Dictionary<Guid, List<(DayOfWeek, TimeOnly, TimeOnly)>>();

        foreach (var entry in existingEntries)
        {
            if (entry.TeacherId != default)
            {
                if (!teacherSchedules.ContainsKey(entry.TeacherId))
                    teacherSchedules[entry.TeacherId] = [];
                teacherSchedules[entry.TeacherId].Add((entry.DayOfWeek, entry.StartTime, entry.EndTime));
            }
            if (!string.IsNullOrEmpty(entry.Room))
            {
                if (!roomSchedules.ContainsKey(entry.Room))
                    roomSchedules[entry.Room] = [];
                roomSchedules[entry.Room].Add((entry.DayOfWeek, entry.StartTime, entry.EndTime));
            }
            if (!groupSchedules.ContainsKey(entry.TeachingGroupId))
                groupSchedules[entry.TeachingGroupId] = [];
            groupSchedules[entry.TeachingGroupId].Add((entry.DayOfWeek, entry.StartTime, entry.EndTime));
        }

        var days = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        var periods = new[]
        {
            new TimeOnly(7, 0), new TimeOnly(8, 0), new TimeOnly(9, 0), new TimeOnly(10, 0),
            new TimeOnly(11, 0), new TimeOnly(12, 0), new TimeOnly(13, 0), new TimeOnly(14, 0),
            new TimeOnly(15, 0), new TimeOnly(16, 0), new TimeOnly(17, 0)
        };

        foreach (var teachingGroup in teachingGroups)
        {
            var courseOffering = courseOfferings.FirstOrDefault(co => co.Id == teachingGroup.CourseOfferingId);
            if (courseOffering is null)
            {
                unscheduled.Add($"Teaching group {teachingGroup.GroupCode} has no course offering.");
                continue;
            }

            var course = courses.FirstOrDefault(c => c.Id == courseOffering.CourseId);
            if (course is null)
            {
                unscheduled.Add($"Course offering {courseOffering.OfferingCode} has no course.");
                continue;
            }

            var allocation = allocations.FirstOrDefault(a => a.CourseId == course.Id);
            if (allocation is null)
            {
                unscheduled.Add($"Course {course.Code} has no teacher allocation.");
                continue;
            }

            var teacher = teachers.FirstOrDefault(t => t.Id == allocation.StaffMemberId);
            if (teacher is null)
            {
                unscheduled.Add($"Teacher not found for allocation {allocation.Id}.");
                continue;
            }

            var sessionsNeeded = 3;
            var sessionsScheduled = 0;

            foreach (var day in days)
            {
                if (sessionsScheduled >= sessionsNeeded) break;

                for (int p = 0; p < periods.Length - 1 && sessionsScheduled < sessionsNeeded; p++)
                {
                    var startTime = periods[p];
                    var endTime = new TimeOnly(startTime.Hour + 2, startTime.Minute);

                    if (HasConflict(teacher.Id, teacherSchedules, day, startTime, endTime, out string teacherConflict))
                    {
                        continue;
                    }

                    var room = teachingGroup.Capacity > 20 ? "Hall A" : "Room 101";
                    if (HasConflict(room, roomSchedules, day, startTime, endTime, out string roomConflict))
                    {
                        continue;
                    }

                    if (HasConflict(teachingGroup.Id, groupSchedules, day, startTime, endTime, out string groupConflict))
                    {
                        continue;
                    }

                    var entry = new TimetableEntry
                    {
                        TeachingGroupId = teachingGroup.Id,
                        CourseId = course.Id,
                        TeacherId = teacher.Id,
                        DayOfWeek = day,
                        StartTime = startTime,
                        EndTime = endTime,
                        Room = room,
                        SessionType = "Lecture",
                        IsActive = true,
                        GeneratedAt = DateTimeOffset.UtcNow,
                        GenerationSource = request.GenerationSource ?? "Auto"
                    };

                    generatedEntries.Add(entry);

                    if (!teacherSchedules.ContainsKey(teacher.Id))
                        teacherSchedules[teacher.Id] = [];
                    teacherSchedules[teacher.Id].Add((day, startTime, endTime));

                    if (!roomSchedules.ContainsKey(room))
                        roomSchedules[room] = [];
                    roomSchedules[room].Add((day, startTime, endTime));

                    if (!groupSchedules.ContainsKey(teachingGroup.Id))
                        groupSchedules[teachingGroup.Id] = [];
                    groupSchedules[teachingGroup.Id].Add((day, startTime, endTime));

                    sessionsScheduled++;
                }
            }

            if (sessionsScheduled < sessionsNeeded)
            {
                warnings.Add($"Only {sessionsScheduled} of {sessionsNeeded} sessions scheduled for {teachingGroup.GroupCode}.");
            }
        }

        if (generatedEntries.Count > 0)
        {
            db.TimetableEntries.AddRange(generatedEntries);
            await db.SaveChangesAsync(cancellationToken);
        }

        var optimizationScore = generatedEntries.Count > 0 ? CalculateOptimizationScore(generatedEntries, warnings) : 0;

        return new GeneratedTimetableResult(
            generatedEntries.Select(e => new TimetableEntryDto(e.Id, e.TeachingGroupId, e.CourseId, e.TeacherId, e.DayOfWeek, e.StartTime, e.EndTime, e.Room, e.SessionType, e.IsActive, e.GeneratedAt, e.GenerationSource)).ToList(),
            conflicts,
            warnings,
            optimizationScore,
            unscheduled,
            conflicts.Count == 0);
    }

    private static bool HasConflict(Guid entityId, Dictionary<Guid, List<(DayOfWeek, TimeOnly, TimeOnly)>> schedules, DayOfWeek day, TimeOnly start, TimeOnly end, out string reason)
    {
        reason = string.Empty;
        if (schedules.TryGetValue(entityId, out var list))
        {
            foreach (var (d, s, e) in list)
            {
                if (d == day && s < end && start < e)
                {
                    reason = $"Overlap on {day} {s:hh\\:mm}-{e:hh\\:mm}";
                    return true;
                }
            }
        }
        return false;
    }

    private static bool HasConflict(string entityId, Dictionary<string, List<(DayOfWeek, TimeOnly, TimeOnly)>> schedules, DayOfWeek day, TimeOnly start, TimeOnly end, out string reason)
    {
        reason = string.Empty;
        if (schedules.TryGetValue(entityId, out var list))
        {
            foreach (var (d, s, e) in list)
            {
                if (d == day && s < end && start < e)
                {
                    reason = $"Overlap on {day} {s:hh\\:mm}-{e:hh\\:mm}";
                    return true;
                }
            }
        }
        return false;
    }

    private static double CalculateOptimizationScore(List<TimetableEntry> entries, List<string> warnings)
    {
        if (entries.Count == 0) return 0;
        var score = 100.0;
        score -= warnings.Count * 5;
        return Math.Max(0, Math.Min(100, score));
    }
}
