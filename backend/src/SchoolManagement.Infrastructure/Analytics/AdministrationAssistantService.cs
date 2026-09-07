using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Domain.Workflows;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Analytics;

public sealed class AdministrationAssistantService(SchoolManagementDbContext db)
{
    public async Task<DashboardStats> GetDashboardStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalStudents = await db.Students.AsNoTracking().LongCountAsync(cancellationToken);
        var activeStudents = await db.Students.AsNoTracking().CountAsync(s => s.Status == "Active", cancellationToken);
        var pendingAdmissions = await db.Admissions.AsNoTracking().CountAsync(a => a.Status == "Pending", cancellationToken);

        var totalAttendanceRecords = await db.StudentAttendances.AsNoTracking().LongCountAsync(cancellationToken);
        var presentCount = await db.StudentAttendances.AsNoTracking().CountAsync(a => a.Status == "Present", cancellationToken);
        var attendanceRate = totalAttendanceRecords > 0 ? Math.Round((decimal)presentCount / totalAttendanceRecords * 100m, 2) : 0m;

        var outstandingFees = await db.StudentInvoices.AsNoTracking()
            .Where(i => i.PaidAmount < i.Amount)
            .SumAsync(i => (decimal?)(i.Amount - i.PaidAmount)) ?? 0m;

        var examPerformance = await db.Results.AsNoTracking()
            .Where(r => r.Score.HasValue)
            .AnyAsync(cancellationToken)
            ? Math.Round(await db.Results.AsNoTracking().Where(r => r.Score.HasValue).AverageAsync(r => r.Score!.Value, cancellationToken), 2)
            : (decimal?)null;

        var totalPlacements = await db.StudentPlacements.AsNoTracking().LongCountAsync(cancellationToken);
        var incompletePlacements = await db.StudentPlacements.AsNoTracking()
            .CountAsync(p => p.Status == "Incomplete", cancellationToken);
        var placementCompletion = totalPlacements > 0
            ? Math.Round((decimal)(totalPlacements - incompletePlacements) / totalPlacements * 100m, 2)
            : 100m;

        var certificatesIssued = await db.Certificates.AsNoTracking()
            .CountAsync(c => !c.IsRevoked, cancellationToken);

        var workflowItemsAwaitingAction = await db.WorkflowInstances.AsNoTracking()
            .CountAsync(w => !w.IsCompleted, cancellationToken);

        return new DashboardStats(
            (int)totalStudents,
            (int)activeStudents,
            (int)pendingAdmissions,
            attendanceRate,
            Math.Round(outstandingFees, 2),
            examPerformance,
            placementCompletion,
            (int)certificatesIssued,
            (int)workflowItemsAwaitingAction);
    }

    public async Task<string> AnswerQuestionAsync(string question, CancellationToken cancellationToken = default)
    {
        var normalized = question.ToLowerInvariant();

        if (normalized.Contains("how many student") || normalized.Contains("total student") || normalized.Contains("number of student"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return $"There are {stats.TotalStudents} total students, {stats.ActiveStudents} of which are active.";
        }

        if (normalized.Contains("pending admission"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return $"There are {stats.PendingAdmissions} pending admissions awaiting review.";
        }

        if (normalized.Contains("attendance rate"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return $"The overall attendance rate is {stats.AttendanceRate}%.";
        }

        if (normalized.Contains("outstanding fee") || normalized.Contains("unpaid fee") || normalized.Contains("fee balance"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return $"The total outstanding fees amount to {stats.OutstandingFees:C}.";
        }

        if (normalized.Contains("teacher workload"))
        {
            var workload = await db.TimetableEntries.AsNoTracking().LongCountAsync(cancellationToken);
            var teachers = await db.StaffMembers.AsNoTracking().LongCountAsync(cancellationToken);
            return $"There are {teachers} teachers with {workload} scheduled timetable entries.";
        }

        if (normalized.Contains("placement") && (normalized.Contains("incomplete") || normalized.Contains("pending")))
        {
            var incomplete = await db.StudentPlacements.AsNoTracking()
                .CountAsync(p => p.Status == "Incomplete", cancellationToken);
            return $"There are {incomplete} incomplete placements.";
        }

        if (normalized.Contains("exam performance") || normalized.Contains("average score"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return stats.ExamPerformance.HasValue
                ? $"The average exam performance score is {stats.ExamPerformance.Value:F2}."
                : "No exam performance data is available.";
        }

        if (normalized.Contains("workflow") || normalized.Contains("awaiting action"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return $"There are {stats.WorkflowItemsAwaitingAction} workflow items awaiting action.";
        }

        if (normalized.Contains("certificate"))
        {
            var stats = await GetDashboardStatsAsync(cancellationToken);
            return $"There are {stats.CertificatesIssued} certificates issued.";
        }

        return "I'm sorry, I don't have an answer for that question. Try asking about students, admissions, attendance, fees, teacher workload, placements, exam performance, workflows, or certificates.";
    }
}
