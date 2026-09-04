using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Domain.Documents;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Student360;

public sealed class Student360Service(SchoolManagementDbContext db)
{
    public async Task<Student360ProfileDto> GetProfileAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == studentId, cancellationToken)
            ?? throw new KeyNotFoundException("Student not found.");

        var fullName = $"{student.FirstName} {student.LastName}".Trim();

        var admission = student.AdmissionId.HasValue
            ? await db.Admissions.AsNoTracking().SingleOrDefaultAsync(x => x.Id == student.AdmissionId.Value, cancellationToken)
            : null;

        var enrollment = await db.StudentEnrollments.AsNoTracking().SingleOrDefaultAsync(x => x.StudentId == studentId, cancellationToken);

        var programme = enrollment is not null
            ? await db.Programmes.AsNoTracking().SingleOrDefaultAsync(x => x.Id == enrollment.ProgrammeId, cancellationToken)
            : null;

        string? department = null;
        string? faculty = null;
        if (programme is not null)
        {
            var dept = await db.Departments.AsNoTracking().SingleOrDefaultAsync(x => x.Id == programme.DepartmentId, cancellationToken);
            if (dept is not null)
            {
                department = dept.Name;
                var fac = await db.Faculties.AsNoTracking().SingleOrDefaultAsync(x => x.Id == dept.FacultyId, cancellationToken);
                faculty = fac?.Name;
            }
        }

        var latestAcademicStatus = await db.StudentAcademicStatuses.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.YearOfStudy)
            .ThenByDescending(x => x.SemesterId)
            .FirstOrDefaultAsync(cancellationToken);

        string currentSemester = string.Empty;
        if (latestAcademicStatus is not null)
        {
            var semester = await db.Semesters.AsNoTracking().SingleOrDefaultAsync(x => x.Id == latestAcademicStatus.SemesterId, cancellationToken);
            currentSemester = semester?.Name ?? string.Empty;
        }

        var attendanceRecords = await db.AttendanceRecords.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(cancellationToken);

        var totalSessions = attendanceRecords.Count;
        var presentSessions = attendanceRecords.Count(x => x.Status == nameof(AttendanceStatus.Present));
        var absentSessions = attendanceRecords.Count(x => x.Status == nameof(AttendanceStatus.Absent));
        var lateSessions = attendanceRecords.Count(x => x.Status == nameof(AttendanceStatus.Late));
        var attendancePercentage = totalSessions > 0 ? (double)presentSessions / totalSessions * 100 : 0.0;

        var assessments = await db.StudentAssessments.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(cancellationToken);

        var assessmentCount = assessments.Count;
        var averageScore = assessmentCount > 0 ? (double?)assessments.Average(x => x.Score) : null;
        var gpa = latestAcademicStatus?.CumulativeGpa;

        var results = await db.Results.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.Status != ResultStatus.Missed)
            .ToListAsync(cancellationToken);

        var examCount = results.Count;
        var averageExamScore = examCount > 0 ? (double?)results.Average(x => x.Score) : null;
        var passCount = results.Count(x => x.Score >= 50);
        var passRate = examCount > 0 ? (double)passCount / examCount * 100 : 0.0;

        var invoices = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(cancellationToken);

        var totalInvoiced = invoices.Sum(x => x.Amount);
        var totalPaid = invoices.Sum(x => x.PaidAmount);
        var outstandingBalance = totalInvoiced - totalPaid;

        var placements = await db.StudentPlacements.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .ToListAsync(cancellationToken);

        var activePlacements = placements.Count(x => x.Status == "Active");
        var completedPlacements = placements.Count(x => x.Status == "Completed");
        var totalPlacements = placements.Count;
        var placementCompletionRate = totalPlacements > 0 ? (double?)completedPlacements / totalPlacements * 100 : null;

        var certificates = await db.Certificates.AsNoTracking()
            .Where(x => x.StudentId == studentId && !x.IsRevoked)
            .ToListAsync(cancellationToken);

        var certificateCount = certificates.Count;
        var latestCertificateDate = certificates.Count > 0 ? (DateOnly?)certificates.Max(x => x.GraduationDate) : null;

        var documentCount = await db.StudentDocuments.AsNoTracking()
            .CountAsync(x => x.StudentId == studentId && !x.IsArchived, cancellationToken);

        var riskIndicators = new List<string>();
        if (attendancePercentage < 75)
            riskIndicators.Add("Low attendance");
        if (outstandingBalance > 0)
            riskIndicators.Add("Outstanding fees");
        if (averageScore.HasValue && averageScore.Value < 50)
            riskIndicators.Add("Low academic performance");

        var admissionDate = enrollment is not null ? (DateOnly?)enrollment.AdmissionDate : null;

        return new Student360ProfileDto(
            StudentId: student.Id,
            StudentNumber: student.StudentNumber,
            FullName: fullName,
            Status: student.Status,
            DateOfBirth: student.DateOfBirth,
            Gender: student.Gender,
            Email: student.Email,
            PhoneNumber: student.PhoneNumber,
            AdmissionId: student.AdmissionId,
            AdmissionDate: admissionDate,
            AdmissionStatus: admission?.Status ?? string.Empty,
            ProgrammeId: programme?.Id,
            ProgrammeName: programme?.Name,
            Department: department,
            Faculty: faculty,
            CurrentSemester: currentSemester,
            EnrollmentStatus: enrollment?.Status ?? string.Empty,
            AttendancePercentage: attendancePercentage,
            TotalSessions: totalSessions,
            PresentSessions: presentSessions,
            AbsentSessions: absentSessions,
            LateSessions: lateSessions,
            AverageScore: averageScore,
            GPA: gpa.HasValue ? (double?)gpa.Value : null,
            AssessmentCount: assessmentCount,
            AverageExamScore: averageExamScore,
            ExamCount: examCount,
            PassRate: passRate,
            OutstandingBalance: outstandingBalance,
            TotalInvoiced: totalInvoiced,
            TotalPaid: totalPaid,
            ActivePlacements: activePlacements,
            CompletedPlacements: completedPlacements,
            PlacementCompletionRate: placementCompletionRate,
            CertificateCount: certificateCount,
            LatestCertificateDate: latestCertificateDate,
            DocumentCount: documentCount,
            RiskIndicators: riskIndicators
        );
    }
}
