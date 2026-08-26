using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Reporting;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Reporting;

public sealed class ReportGenerator(SchoolManagementDbContext db)
{
    public async Task<StudentReportCardDto?> GenerateStudentReportCardAsync(Guid studentId, Guid? academicYearId, Guid? semesterId, CancellationToken cancellationToken = default)
    {
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.Id == studentId, cancellationToken);
        if (student is null) return null;
        var query = db.Results.AsNoTracking().Where(r => r.StudentId == studentId);
        if (academicYearId.HasValue)
        {
            var semesterIds = await db.Semesters.AsNoTracking().Where(s => s.AcademicYearId == academicYearId.Value).Select(s => s.Id).ToListAsync(cancellationToken);
            query = query.Where(r => semesterIds.Contains(r.SemesterId));
        }
        if (semesterId.HasValue) query = query.Where(r => r.SemesterId == semesterId.Value);
        var results = await query.Select(r => new { r.CourseId, CourseCode = db.Courses.Where(c => c.Id == r.CourseId).Select(c => c.Code).FirstOrDefault() ?? string.Empty, CourseName = db.Courses.Where(c => c.Id == r.CourseId).Select(c => c.Name).FirstOrDefault() ?? string.Empty, r.Score, r.Grade, r.GradePoint, r.Status, r.IsFinal }).ToListAsync(cancellationToken);
        var formatted = results.Select(r => new StudentReportCardDto.ResultEntry(r.CourseCode, r.CourseName, r.Score, r.Grade, r.GradePoint, r.Status.ToString(), r.IsFinal)).ToList();
        var gpa = formatted.Any(r => r.GradePoint.HasValue) ? Math.Round(formatted.Where(r => r.GradePoint.HasValue).Average(r => r.GradePoint!.Value), 2) : 0m;
        return new StudentReportCardDto(student.StudentNumber, $"{student.FirstName} {student.LastName}".Trim(), formatted, gpa);
    }

    public async Task<FeeReceiptDto?> GenerateFeeReceiptAsync(Guid paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await db.Payments.Include(p => p.StudentInvoice).AsNoTracking().FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);
        if (payment is null) return null;
        return new FeeReceiptDto(payment.Id, payment.StudentInvoiceId, payment.StudentInvoice!.InvoiceNumber, payment.StudentInvoice.StudentId, payment.ReceiptNumber, payment.Amount, payment.Currency, payment.PaymentMethod, payment.Reference ?? string.Empty, payment.PaidAt);
    }

    public async Task<AttendanceReportDto> GenerateAttendanceReportAsync(Guid classId, (DateOnly From, DateOnly To) dateRange, CancellationToken cancellationToken = default)
    {
        var sessions = await db.AttendanceSessions.AsNoTracking().Include(s => s.TimetableEntry).Where(s => s.TimetableEntry.TeachingGroupId == classId && s.SessionDate >= dateRange.From && s.SessionDate <= dateRange.To).OrderBy(s => s.SessionDate).ToListAsync(cancellationToken);
        var sessionIds = sessions.Select(s => s.Id).ToList();
        var records = await db.StudentAttendances.AsNoTracking().Where(a => sessionIds.Contains(a.AttendanceSessionId)).ToListAsync(cancellationToken);
        var summary = records.GroupBy(r => r.Status).ToDictionary(g => g.Key.ToString(), g => g.Count());
        return new AttendanceReportDto(classId, dateRange.From, dateRange.To, sessions.Count, records.Count, summary, sessions.Select(s => new AttendanceReportDto.SessionSummary(s.Id, s.SessionDate, s.Status.ToString(), records.Count(r => r.AttendanceSessionId == s.Id))).ToList());
    }

    public async Task<FinancialStatementDto> GenerateFinancialStatementAsync(string? period, CancellationToken cancellationToken = default)
    {
        var invoices = await db.StudentInvoices.AsNoTracking().ToListAsync(cancellationToken);
        var bills = await db.Bills.AsNoTracking().ToListAsync(cancellationToken);
        var totalRevenue = invoices.Sum(i => i.Amount);
        var totalCollected = invoices.Sum(i => i.PaidAmount);
        var totalExpenses = bills.Sum(b => b.TotalAmount);
        return new FinancialStatementDto(period ?? DateTime.UtcNow.ToString("yyyy-MM"), totalRevenue, totalCollected, totalExpenses, totalRevenue - totalCollected, totalCollected - totalExpenses, new List<FinancialStatementDto.PlEntry> { new("Tuition Fees", totalRevenue), new("Other Income", 0m), new("Total Revenue", totalRevenue), new("Cost of Operations", totalExpenses), new("Net Surplus", totalCollected - totalExpenses) });
    }
}
