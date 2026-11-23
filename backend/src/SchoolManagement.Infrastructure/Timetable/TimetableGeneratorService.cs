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

        var requestedGroupIds = request.TeachingGroupIds is { Count: > 0 }
            ? request.TeachingGroupIds.Distinct().ToArray()
            : request.TeachingGroupId.HasValue ? [request.TeachingGroupId.Value] : [];
        var cohortQuery = db.TeachingGroups.AsNoTracking()
            .Where(group => group.IsActive &&
                group.CurriculumId.HasValue &&
                group.SemesterId == semesterId);
        if (requestedGroupIds.Length > 0)
            cohortQuery = cohortQuery.Where(group => requestedGroupIds.Contains(group.Id));
        if (request.CurriculumId.HasValue)
            cohortQuery = cohortQuery.Where(group => group.CurriculumId == request.CurriculumId.Value);
        if (request.YearOfStudy.HasValue)
            cohortQuery = cohortQuery.Where(group => group.YearOfStudy == request.YearOfStudy.Value);
        if (request.ProgrammeId.HasValue)
            cohortQuery = cohortQuery.Where(group => group.ProgrammeId == request.ProgrammeId.Value);
        var cohortGroups = await cohortQuery.OrderBy(group => group.Name).ToListAsync(cancellationToken);
        if (cohortGroups.Count > 0)
            return await GenerateForProgrammeYearClassesAsync(request, semester, cohortGroups, cancellationToken);

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
        if (request.TeachingGroupIds is { Count: > 0 } selectedGroupIds)
        {
            var requestedGroupIds = selectedGroupIds.Distinct().ToArray();
            teachingGroupsQuery = teachingGroupsQuery.Where(x => requestedGroupIds.Contains(x.Id));
        }
        else if (request.TeachingGroupId.HasValue)
        {
            teachingGroupsQuery = teachingGroupsQuery.Where(x => x.Id == request.TeachingGroupId.Value);
        }

        var teachingGroups = await teachingGroupsQuery.OrderBy(x => x.GroupCode).ToListAsync(cancellationToken);
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

        // Remove all selected groups' old slots from the candidate index up front so
        // they do not block one another's replacements. Failed groups are restored
        // immediately before the next group is considered.
        foreach (var previous in existingForGroups) RemoveFromSchedules(previous);

        foreach (var teachingGroup in teachingGroups)
        {
            var previousGroupEntries = existingForGroups.Where(x => x.TeachingGroupId == teachingGroup.Id).ToList();
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

    private async Task<GeneratedTimetableResult> GenerateForProgrammeYearClassesAsync(
        GenerateTimetableRequest request,
        Semester semester,
        IReadOnlyList<TeachingGroup> teachingGroups,
        CancellationToken cancellationToken)
    {
        var conflicts = new List<string>();
        var warnings = new List<string>();
        var unscheduled = new List<string>();
        var generatedEntries = new List<TimetableEntry>();
        var selectedGroupIds = teachingGroups.Select(group => group.Id).ToHashSet();
        var existingEntries = await db.TimetableEntries.AsNoTracking()
            .Where(entry => entry.IsActive)
            .ToListAsync(cancellationToken);
        var occupied = existingEntries
            .Where(entry => !selectedGroupIds.Contains(entry.TeachingGroupId))
            .ToList();
        var replacements = new List<TimetableEntry>();
        var successfulGroupIds = new HashSet<Guid>();
        var days = new[] { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday };
        var periods = new[]
        {
            new TimeOnly(7, 0), new TimeOnly(8, 0), new TimeOnly(9, 0), new TimeOnly(10, 0),
            new TimeOnly(11, 0), new TimeOnly(12, 0), new TimeOnly(13, 0), new TimeOnly(14, 0),
            new TimeOnly(15, 0), new TimeOnly(16, 0), new TimeOnly(17, 0)
        };
        var rooms = new[] { "Room 101", "Room 102", "Room 103", "Hall A", "Hall B" };
        var roomCounter = 0;

        foreach (var group in teachingGroups)
        {
            var groupCandidates = new List<TimetableEntry>();
            var groupFailed = false;
            var mappings = await db.CurriculumCourses.AsNoTracking()
                .Where(mapping => mapping.CurriculumId == group.CurriculumId &&
                    mapping.YearOfStudy == group.YearOfStudy &&
                    mapping.SemesterNumber == semester.Sequence &&
                    !mapping.IsDeleted)
                .Select(mapping => mapping.CourseId)
                .Distinct()
                .ToListAsync(cancellationToken);
            var offerings = await db.CourseOfferings.AsNoTracking()
                .Where(offering => offering.IsActive &&
                    offering.ProgrammeId == group.ProgrammeId &&
                    offering.SemesterId == semester.Id &&
                    mappings.Contains(offering.CourseId))
                .ToListAsync(cancellationToken);
            var courses = await db.Courses.AsNoTracking()
                .Where(course => course.IsActive && !course.IsDeleted &&
                    offerings.Select(offering => offering.CourseId).Contains(course.Id))
                .ToListAsync(cancellationToken);
            var allocations = await db.TeachingAllocations.AsNoTracking()
                .Where(allocation => allocation.IsActive &&
                    courses.Select(course => course.Id).Contains(allocation.CourseId))
                .ToListAsync(cancellationToken);
            var teacherIds = allocations.Select(allocation => allocation.StaffMemberId).Distinct().ToArray();
            var teachers = await db.StaffMembers.AsNoTracking()
                .Where(teacher => teacherIds.Contains(teacher.Id) &&
                    teacher.IsActive && teacher.EmploymentStatus == "Active")
                .ToDictionaryAsync(teacher => teacher.Id, cancellationToken);

            if (courses.Count == 0)
            {
                warnings.Add($"{group.Name ?? group.GroupCode}: no active course units are mapped to this curriculum year and semester.");
                unscheduled.Add($"{group.Name ?? group.GroupCode} was not generated because it has no eligible course units.");
                continue;
            }

            foreach (var course in courses.OrderBy(course => course.Code))
            {
                var allocation = allocations.FirstOrDefault(item => item.CourseId == course.Id && teachers.ContainsKey(item.StaffMemberId));
                if (allocation is null || !teachers.TryGetValue(allocation.StaffMemberId, out var teacher))
                {
                    groupFailed = true;
                    unscheduled.Add($"{group.Name ?? group.GroupCode}: {course.Code} has no active teacher allocation.");
                    break;
                }

                var sessionsNeeded = Math.Max(1, course.CreditUnits);
                var sessionsScheduled = 0;
                foreach (var day in days)
                {
                    if (sessionsScheduled >= sessionsNeeded) break;
                    for (var index = 0; index < periods.Length - 1 && sessionsScheduled < sessionsNeeded; index++)
                    {
                        var start = periods[index];
                        var end = start.AddHours(2);
                        var room = rooms[roomCounter++ % rooms.Length];
                        bool Overlaps(TimetableEntry other) =>
                            other.DayOfWeek == day && other.StartTime < end && start < other.EndTime;
                        if (occupied.Any(other => Overlaps(other) &&
                                (other.TeacherId == teacher.Id ||
                                 other.TeachingGroupId == group.Id ||
                                 (!string.IsNullOrWhiteSpace(other.Room) &&
                                  string.Equals(other.Room.Trim(), room, StringComparison.OrdinalIgnoreCase)))) ||
                            groupCandidates.Any(other => Overlaps(other) &&
                                (other.TeacherId == teacher.Id ||
                                 other.TeachingGroupId == group.Id ||
                                 (!string.IsNullOrWhiteSpace(other.Room) &&
                                  string.Equals(other.Room.Trim(), room, StringComparison.OrdinalIgnoreCase)))))
                        {
                            conflicts.Add($"{group.Name ?? group.GroupCode}: {course.Code} could not use {day} {start:HH:mm}-{end:HH:mm} in {room} because of a class, teacher or room conflict.");
                            continue;
                        }

                        groupCandidates.Add(new TimetableEntry
                        {
                            TeachingGroupId = group.Id,
                            CourseId = course.Id,
                            TeacherId = teacher.Id,
                            StaffMemberId = teacher.Id,
                            DayOfWeek = day,
                            StartTime = start,
                            EndTime = end,
                            Room = room,
                            SessionType = "Lecture",
                            GeneratedAt = DateTimeOffset.UtcNow,
                            GenerationSource = request.GenerationSource ?? "Manual"
                        });
                        sessionsScheduled++;
                    }
                }

                if (sessionsScheduled < sessionsNeeded)
                {
                    groupFailed = true;
                    unscheduled.Add($"{group.Name ?? group.GroupCode}: only {sessionsScheduled} of {sessionsNeeded} sessions could be scheduled for {course.Code}; its existing timetable was retained.");
                    break;
                }
            }

            if (groupFailed)
            {
                warnings.Add($"{group.Name ?? group.GroupCode} was not replaced because every mapped course unit could not be scheduled.");
                continue;
            }

            var oldEntries = existingEntries.Where(entry => entry.IsActive && entry.TeachingGroupId == group.Id).ToList();
            replacements.AddRange(oldEntries);
            successfulGroupIds.Add(group.Id);
            generatedEntries.AddRange(groupCandidates);
            occupied.AddRange(groupCandidates);
        }

        if (successfulGroupIds.Count > 0)
        {
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            var oldEntries = await db.TimetableEntries
                .Where(entry => entry.IsActive && successfulGroupIds.Contains(entry.TeachingGroupId))
                .ToListAsync(cancellationToken);
            foreach (var old in oldEntries) old.IsActive = false;
            db.TimetableEntries.AddRange(generatedEntries);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        var score = generatedEntries.Count == 0 ? 0 : Math.Max(0, 100 - warnings.Count * 5);
        return new GeneratedTimetableResult(
            generatedEntries.Select(entry => new TimetableEntryDto(
                entry.Id, entry.TeachingGroupId, entry.CourseId, entry.TeacherId,
                entry.DayOfWeek, entry.StartTime, entry.EndTime, entry.Room,
                entry.SessionType, entry.IsActive, entry.GeneratedAt, entry.GenerationSource)).ToList(),
            conflicts, warnings, score, unscheduled, conflicts.Count == 0);
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
