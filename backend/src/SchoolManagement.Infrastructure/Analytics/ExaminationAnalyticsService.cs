using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Analytics;

public sealed class ExaminationAnalyticsService(SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<CourseAnalytics>> GetCourseAnalyticsAsync(Guid semesterId, CancellationToken cancellationToken = default)
    {
        var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == semesterId, cancellationToken);
        if (semester is null) return [];

        var results = await db.Results.AsNoTracking()
            .Where(r => r.SemesterId == semesterId && r.Score.HasValue)
            .ToListAsync(cancellationToken);

        var courseIds = results.Select(r => r.CourseId).Distinct().ToList();
        if (courseIds.Count == 0) return [];

        var courses = await db.Courses.AsNoTracking()
            .Where(c => courseIds.Contains(c.Id))
            .ToListAsync(cancellationToken);

        var courseLookup = courses.ToDictionary(c => c.Id);

        return courseIds.Select(courseId =>
        {
            var courseResults = results.Where(r => r.CourseId == courseId).ToList();
            var scores = courseResults.Select(r => r.Score!.Value).OrderBy(s => s).ToList();

            var average = scores.Any() ? Math.Round(scores.Average(), 2) : (decimal?)null;
            var median = scores.Any() ? GetMedian(scores) : (decimal?)null;

            var passCount = scores.Count(s => s >= 40m);
            var failCount = scores.Count(s => s < 40m);
            var total = scores.Count;
            var passRate = total > 0 ? Math.Round((decimal)passCount / total * 100m, 2) : 0m;
            var failRate = total > 0 ? Math.Round((decimal)failCount / total * 100m, 2) : 0m;

            var gradeDistribution = courseResults
                .Where(r => !string.IsNullOrWhiteSpace(r.Grade))
                .GroupBy(r => r.Grade!)
                .ToDictionary(g => g.Key, g => g.Count());

            return new CourseAnalytics(
                courseId,
                courseLookup[courseId].Code,
                courseLookup[courseId].Name,
                average,
                median,
                passRate,
                failRate,
                gradeDistribution);
        }).ToList();
    }

    public async Task<SemesterAnalytics> GetSemesterAnalyticsAsync(Guid semesterId, CancellationToken cancellationToken = default)
    {
        var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == semesterId, cancellationToken);
        if (semester is null)
            return new SemesterAnalytics(semesterId, [], null, 0m);

        var courses = await GetCourseAnalyticsAsync(semesterId, cancellationToken);

        var overallAverage = courses.Any(c => c.AverageScore.HasValue)
            ? Math.Round(courses.Where(c => c.AverageScore.HasValue).Average(c => c.AverageScore!.Value), 2)
            : (decimal?)null;

        var overallPassRate = courses.Any()
            ? Math.Round(courses.Average(c => c.PassRate), 2)
            : 0m;

        return new SemesterAnalytics(semesterId, courses, overallAverage, overallPassRate);
    }

    public async Task<IReadOnlyList<StudentRiskAnalytics>> GetAtRiskStudentsAsync(Guid semesterId, CancellationToken cancellationToken = default)
    {
        var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == semesterId, cancellationToken);
        if (semester is null) return [];

        var studentIdsWithLowScores = await db.Results.AsNoTracking()
            .Where(r => r.SemesterId == semesterId && r.Score.HasValue && r.Score < 40m)
            .GroupBy(r => r.StudentId)
            .Select(g => new { StudentId = g.Key, LowScoreCount = g.Count() })
            .ToListAsync(cancellationToken);

        var attendanceSessions = await db.AttendanceSessions.AsNoTracking()
            .Where(s => s.SessionDate >= semester.StartDate && s.SessionDate <= semester.EndDate)
            .ToListAsync(cancellationToken);

        var sessionIds = attendanceSessions.Select(s => s.Id).ToHashSet();
        var studentAttendances = await db.StudentAttendances.AsNoTracking()
            .Where(a => sessionIds.Contains(a.AttendanceSessionId))
            .ToListAsync(cancellationToken);

        var attendanceByStudent = studentAttendances
            .GroupBy(a => a.StudentId)
            .ToDictionary(g => g.Key, g =>
            {
                var total = g.Count();
                var present = g.Count(a => a.Status == "Present");
                return total > 0 ? Math.Round((decimal)present / total * 100m, 2) : 100m;
            });

        var allStudentIds = studentIdsWithLowScores.Select(x => x.StudentId)
            .Union(attendanceByStudent.Keys)
            .Distinct()
            .ToList();

        if (allStudentIds.Count == 0) return [];

        var students = await db.Students.AsNoTracking()
            .Where(s => allStudentIds.Contains(s.Id))
            .ToListAsync(cancellationToken);

        var studentLookup = students.ToDictionary(s => s.Id);

        var resultScores = await db.Results.AsNoTracking()
            .Where(r => r.SemesterId == semesterId && r.Score.HasValue && allStudentIds.Contains(r.StudentId))
            .GroupBy(r => r.StudentId)
            .Select(g => new { StudentId = g.Key, AvgScore = Math.Round(g.Average(r => r.Score!.Value), 2) })
            .ToListAsync(cancellationToken);

        var scoreLookup = resultScores.ToDictionary(x => x.StudentId, x => x.AvgScore);

        var lowScoreStudentIds = new HashSet<Guid>(studentIdsWithLowScores.Select(x => x.StudentId));

        return allStudentIds.Select(studentId =>
        {
            var student = studentLookup.GetValueOrDefault(studentId);
            var name = student is null ? "Unknown" : $"{student.FirstName} {student.LastName}".Trim();

            var avgScore = scoreLookup.GetValueOrDefault(studentId);
            var attendancePct = attendanceByStudent.GetValueOrDefault(studentId);

            var riskFactors = new List<string>();
            if (lowScoreStudentIds.Contains(studentId))
                riskFactors.Add("Low academic performance");
            if (attendancePct < 70m)
                riskFactors.Add("Low attendance");

            var riskLevel = riskFactors.Count switch
            {
                2 => "High",
                1 => "Medium",
                _ => "Low"
            };

            return new StudentRiskAnalytics(studentId, name, avgScore, attendancePct, riskLevel, riskFactors);
        }).ToList();
    }

    private static decimal GetMedian(List<decimal> sortedValues)
    {
        var count = sortedValues.Count;
        if (count == 0) return 0m;

        var mid = count / 2;
        return count % 2 != 0
            ? sortedValues[mid]
            : Math.Round((sortedValues[mid - 1] + sortedValues[mid]) / 2m, 2);
    }
}
