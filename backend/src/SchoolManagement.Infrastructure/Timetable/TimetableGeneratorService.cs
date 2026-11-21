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

        var curriculumOfferingIds = await (
            from offering in db.CourseOfferings.AsNoTracking()
            join curriculum in db.Curricula.AsNoTracking() on offering.ProgrammeId equals curriculum.ProgrammeId
            join mapping in db.CurriculumCourses.AsNoTracking() on curriculum.Id equals mapping.CurriculumId
            where offering.SemesterId == semesterId && offering.IsActive && curriculum.IsActive && mapping.CourseId == offering.CourseId &&
                  (!request.CurriculumId.HasValue || curriculum.Id == request.CurriculumId.Value) &&
                  (!request.ProgrammeId.HasValue || offering.ProgrammeId == request.ProgrammeId.Value) &&
                  (!request.YearOfStudy.HasValue || mapping.YearOfStudy == request.YearOfStudy.Value) &&
                  (!request.CurriculumSemesterNumber.HasValue || mapping.SemesterNumber == request.CurriculumSemesterNumber.Value)
            select offering.Id).Distinct().ToListAsync(cancellationToken);
        var courseOfferings = await db.CourseOfferings.AsNoTracking()
            .Where(x => x.SemesterId == semesterId && x.IsActive && curriculumOfferingIds.Contains(x.Id))
            .ToListAsync(cancellationToken);

        var courseOfferingIds = courseOfferings.Select(x => x.Id).ToHashSet();
        var teachingGroupsQuery = db.TeachingGroups.AsNoTracking()
            .Where(x => courseOfferingIds.Contains(x.CourseOfferingId) && x.IsActive);

        // The API accepts a teaching-group ID. Do not compare it with a course-offering ID:
        // those are separate records and the mismatch silently generated empty timetables.
        if (request.TeachingGroupIds is { Count: > 0 })
        {
            var requestedGroupIds = request.TeachingGroupIds.Distinct().ToArray();
            teachingGroupsQuery = teachingGroupsQuery.Where(x => requestedGroupIds.Contains(x.Id));
        }
        else if (request.TeachingGroupId.HasValue)
        {
            teachingGroupsQuery = teachingGroupsQuery.Where(x => x.Id == request.TeachingGroupId.Value);
        }

        var teachingGroups = await teachingGroupsQuery.ToListAsync(cancellationToken);
        if ((request.TeachingGroupId.HasValue || request.TeachingGroupIds is { Count: > 0 }) && teachingGroups.Count == 0)
            return new GeneratedTimetableResult([], [], [], 0,
                ["None of the selected teaching groups belong to the selected programme curriculum and academic period."], false);
        var selectedOfferingIds = teachingGroups.Select(x => x.CourseOfferingId).ToHashSet();
        courseOfferings = courseOfferings.Where(x => selectedOfferingIds.Contains(x.Id)).ToList();

        var courses = await db.Courses.AsNoTracking()
            .Where(x => courseOfferings.Select(co => co.CourseId).Contains(x.Id))
            .ToListAsync(cancellationToken);

        var courseIds = courses.Select(c => c.Id).ToHashSet();

        var allocations = await db.TeachingAllocations.AsNoTracking()
            .Where(x => x.IsActive && courseIds.Contains(x.CourseId))
            .ToListAsync(cancellationToken);

        var teacherIds = allocations.Select(a => a.StaffMemberId).ToHashSet();
        var teachers = await db.StaffMembers.AsNoTracking()
            .Where(x => teacherIds.Contains(x.Id) && x.IsActive && x.EmploymentStatus == "Active")
            .ToListAsync(cancellationToken);

        var existingEntries = await db.TimetableEntries.AsNoTracking()
            .Where(x => x.IsActive)
            .ToListAsync(cancellationToken);

        var teacherSchedules = new Dictionary<Guid, List<(DayOfWeek, TimeOnly, TimeOnly)>>();
        var roomSchedules = new Dictionary<string, List<(DayOfWeek, TimeOnly, TimeOnly)>>(StringComparer.OrdinalIgnoreCase);
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
        var defaultRooms = new[] { "Room 101", "Room 102", "Room 103", "Hall A", "Hall B" };
        var roomCounter = 0;

        // Keep the existing timetable intact while candidates are evaluated. A group's
        // previous sessions are removed from the in-memory conflict index only while
        // attempting its replacement, and are restored if generation is incomplete.
        var groupIds = teachingGroups.Select(x => x.Id).ToHashSet();
        var existingForGroups = await db.TimetableEntries
            .Where(x => x.IsActive && groupIds.Contains(x.TeachingGroupId))
            .ToListAsync(cancellationToken);
        var successfullyScheduledGroupIds = new HashSet<Guid>();

        void AddToSchedules(TimetableEntry entry)
        {
            var slot = (entry.DayOfWeek, entry.StartTime, entry.EndTime);
            if (entry.TeacherId != default)
            {
                if (!teacherSchedules.ContainsKey(entry.TeacherId)) teacherSchedules[entry.TeacherId] = [];
                teacherSchedules[entry.TeacherId].Add(slot);
            }
            if (!string.IsNullOrWhiteSpace(entry.Room))
            {
                var key = entry.Room.Trim();
                if (!roomSchedules.ContainsKey(key)) roomSchedules[key] = [];
                roomSchedules[key].Add(slot);
            }
            if (!groupSchedules.ContainsKey(entry.TeachingGroupId)) groupSchedules[entry.TeachingGroupId] = [];
            groupSchedules[entry.TeachingGroupId].Add(slot);
        }

        void RemoveFromSchedules(TimetableEntry entry)
        {
            var slot = (entry.DayOfWeek, entry.StartTime, entry.EndTime);
            if (entry.TeacherId != default && teacherSchedules.TryGetValue(entry.TeacherId, out var teacherSlots)) teacherSlots.Remove(slot);
            if (!string.IsNullOrWhiteSpace(entry.Room) && roomSchedules.TryGetValue(entry.Room.Trim(), out var roomSlots)) roomSlots.Remove(slot);
            if (groupSchedules.TryGetValue(entry.TeachingGroupId, out var groupSlots)) groupSlots.Remove(slot);
        }

        foreach (var teachingGroup in teachingGroups)
        {
            var previousGroupEntries = existingForGroups.Where(x => x.TeachingGroupId == teachingGroup.Id).ToList();
            foreach (var previous in previousGroupEntries) RemoveFromSchedules(previous);
            var groupGeneratedEntries = new List<TimetableEntry>();

            var courseOffering = courseOfferings.FirstOrDefault(co => co.Id == teachingGroup.CourseOfferingId);
            if (courseOffering is null)
            {
                unscheduled.Add($"Teaching group {teachingGroup.GroupCode} has no course offering.");
                foreach (var previous in previousGroupEntries) AddToSchedules(previous);
                continue;
            }

            var course = courses.FirstOrDefault(c => c.Id == courseOffering.CourseId);
            if (course is null)
            {
                unscheduled.Add($"Course offering {courseOffering.OfferingCode} has no course.");
                foreach (var previous in previousGroupEntries) AddToSchedules(previous);
                continue;
            }

            var allocation = allocations.FirstOrDefault(a => a.CourseId == course.Id);
            if (allocation is null)
            {
                unscheduled.Add($"Course {course.Code} has no teacher allocation.");
                foreach (var previous in previousGroupEntries) AddToSchedules(previous);
                continue;
            }

            var teacher = teachers.FirstOrDefault(t => t.Id == allocation.StaffMemberId);
            if (teacher is null)
            {
                unscheduled.Add($"Teacher not found or inactive for allocation {allocation.Id}.");
                foreach (var previous in previousGroupEntries) AddToSchedules(previous);
                continue;
            }

            var sessionsNeeded = Math.Max(1, course.CreditUnits);
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
                        conflicts.Add($"Teacher {teacher.LastName}, {teacher.FirstName}: {teacherConflict}");
                        continue;
                    }

                    var room = defaultRooms[roomCounter++ % defaultRooms.Length];
                    if (HasConflict(room, roomSchedules, day, startTime, endTime, out string roomConflict))
                    {
                        conflicts.Add($"Room {room}: {roomConflict}");
                        continue;
                    }

                    if (HasConflict(teachingGroup.Id, groupSchedules, day, startTime, endTime, out string groupConflict))
                    {
                        conflicts.Add($"Teaching group {teachingGroup.GroupCode}: {groupConflict}");
                        continue;
                    }

                    var entry = new TimetableEntry
                    {
                        TeachingGroupId = teachingGroup.Id,
                        CourseId = course.Id,
                        TeacherId = teacher.Id,
                        StaffMemberId = teacher.Id,
                        DayOfWeek = day,
                        StartTime = startTime,
                        EndTime = endTime,
                        Room = room,
                        SessionType = "Lecture",
                        IsActive = true,
                        GeneratedAt = DateTimeOffset.UtcNow,
                        GenerationSource = request.GenerationSource ?? "Auto"
                    };

                    groupGeneratedEntries.Add(entry);

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
                foreach (var candidate in groupGeneratedEntries) RemoveFromSchedules(candidate);
                foreach (var previous in previousGroupEntries) AddToSchedules(previous);
                warnings.Add($"Only {sessionsScheduled} of {sessionsNeeded} sessions scheduled for {teachingGroup.GroupCode}; its existing timetable was retained.");
                unscheduled.Add($"Teaching group {teachingGroup.GroupCode} was not replaced because all required sessions could not be scheduled.");
                continue;
            }

            generatedEntries.AddRange(groupGeneratedEntries);
            successfullyScheduledGroupIds.Add(teachingGroup.Id);
        }

        if (generatedEntries.Count > 0)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            var oldEntriesToReplace = existingForGroups
                .Where(x => successfullyScheduledGroupIds.Contains(x.TeachingGroupId)).ToList();
            foreach (var old in oldEntriesToReplace) old.IsActive = false;
            db.TimetableEntries.AddRange(generatedEntries);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
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
