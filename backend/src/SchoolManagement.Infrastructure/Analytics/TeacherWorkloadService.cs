using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Analytics;

public sealed class TeacherWorkloadService(SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<TeacherWorkload>> GetTeacherWorkloadAsync(Guid semesterId, CancellationToken cancellationToken = default)
    {
        var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == semesterId, cancellationToken);
        if (semester is null) return [];

        var courseOfferings = await db.CourseOfferings.AsNoTracking()
            .Where(co => co.SemesterId == semesterId && co.IsActive)
            .ToListAsync(cancellationToken);

        var courseOfferingIds = courseOfferings.Select(co => co.Id).ToHashSet();

        var teachingGroups = await db.TeachingGroups.AsNoTracking()
            .Where(tg => courseOfferingIds.Contains(tg.CourseOfferingId) && tg.IsActive)
            .ToListAsync(cancellationToken);

        var teachingGroupIds = teachingGroups.Select(tg => tg.Id).ToHashSet();

        var timetableEntries = await db.TimetableEntries.AsNoTracking()
            .Where(t => teachingGroupIds.Contains(t.TeachingGroupId) && t.IsActive)
            .ToListAsync(cancellationToken);

        var allocations = await db.TeachingAllocations.AsNoTracking()
            .Where(a => a.SemesterId == semesterId && a.IsActive)
            .ToListAsync(cancellationToken);

        var teacherIds = timetableEntries.Select(t => t.TeacherId)
            .Union(allocations.Select(a => a.StaffMemberId))
            .Distinct()
            .ToList();

        var staffMembers = await db.StaffMembers.AsNoTracking()
            .Where(s => teacherIds.Contains(s.Id))
            .ToListAsync(cancellationToken);

        var departments = await db.Departments.AsNoTracking()
            .Where(d => d.IsActive)
            .ToListAsync(cancellationToken);

        var result = new List<TeacherWorkload>();

        foreach (var teacherId in teacherIds)
        {
            var entries = timetableEntries.Where(t => t.TeacherId == teacherId).ToList();
            var teacherAllocations = allocations.Where(a => a.StaffMemberId == teacherId).ToList();

            var teachingHours = entries.Sum(e => (decimal)(e.EndTime - e.StartTime).TotalHours);
            var sessionsPerWeek = entries.Count;
            var coursesAssigned = entries.Select(e => e.CourseId)
                .Union(teacherAllocations.Select(a => a.CourseId))
                .Distinct()
                .Count();
            var cohortsAssigned = entries.Select(e => e.TeachingGroupId).Distinct().Count();
            var practicalSessions = entries.Count(e => string.Equals(e.SessionType, "Practical", StringComparison.OrdinalIgnoreCase));

            var taughtCourseIds = entries.Select(e => e.CourseId).ToHashSet();
            var assessmentCount = await db.AssessmentPlans.AsNoTracking()
                .Where(ap => taughtCourseIds.Contains(ap.CourseId) && ap.IsActive)
                .CountAsync(cancellationToken);

            var entryIds = entries.Select(e => e.Id).ToHashSet();
            var attendanceResponsibilities = await db.AttendanceSessions.AsNoTracking()
                .Where(sa => entryIds.Contains(sa.TimetableEntryId))
                .CountAsync(cancellationToken);

            var examResponsibilities = await db.Results.AsNoTracking()
                .Where(r => taughtCourseIds.Contains(r.CourseId) && r.SemesterId == semesterId)
                .CountAsync(cancellationToken);

            var workloadScore = teachingHours * 1m
                + sessionsPerWeek * 0.5m
                + coursesAssigned * 2m
                + cohortsAssigned * 1m
                + practicalSessions * 1.5m
                + assessmentCount * 2m
                + attendanceResponsibilities * 0.5m
                + examResponsibilities * 1m;

            var warningLevel = workloadScore > 50m ? "High" : workloadScore > 30m ? "Medium" : "Low";

            var staff = staffMembers.FirstOrDefault(s => s.Id == teacherId);
            var teacherName = staff is null ? "Unknown" : $"{staff.FirstName} {staff.LastName}".Trim();

            var departmentName = departments.FirstOrDefault(d => d.HeadStaffId == teacherId) is { } dept
                ? dept.Name
                : "N/A";

            result.Add(new TeacherWorkload(
                teacherId,
                teacherName,
                departmentName,
                Math.Round(teachingHours, 2),
                sessionsPerWeek,
                coursesAssigned,
                cohortsAssigned,
                practicalSessions,
                assessmentCount,
                attendanceResponsibilities,
                examResponsibilities,
                Math.Round(workloadScore, 2),
                warningLevel));
        }

        return result;
    }

    public async Task<IReadOnlyList<DepartmentWorkloadSummary>> GetDepartmentWorkloadSummaryAsync(Guid semesterId, CancellationToken cancellationToken = default)
    {
        var workloads = await GetTeacherWorkloadAsync(semesterId, cancellationToken);

        var departments = await db.Departments.AsNoTracking()
            .Where(d => d.IsActive)
            .ToListAsync(cancellationToken);

        var summaries = new List<DepartmentWorkloadSummary>();

        foreach (var dept in departments)
        {
            var deptTeachers = workloads.Where(w => w.Department == dept.Name).ToList();
            if (deptTeachers.Count == 0) continue;

            var scores = deptTeachers.Select(t => t.WorkloadScore).ToList();
            summaries.Add(new DepartmentWorkloadSummary(
                dept.Id,
                dept.Name,
                deptTeachers.Count,
                Math.Round(scores.Average(), 2),
                Math.Round(scores.Max(), 2),
                Math.Round(scores.Min(), 2)));
        }

        return summaries;
    }
}
