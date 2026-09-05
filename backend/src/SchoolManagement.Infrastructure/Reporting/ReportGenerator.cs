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

        var results = await query.Select(r => new
        {
            r.CourseId,
            CourseCode = db.Courses.Where(c => c.Id == r.CourseId).Select(c => c.Code).FirstOrDefault() ?? string.Empty,
            CourseName = db.Courses.Where(c => c.Id == r.CourseId).Select(c => c.Name).FirstOrDefault() ?? string.Empty,
            r.Score, r.Grade, r.GradePoint, r.Status, r.IsFinal
        }).ToListAsync(cancellationToken);

        var formatted = results.Select(r => new StudentReportCardDto.ResultEntry(r.CourseCode, r.CourseName, r.Score, r.Grade, r.GradePoint, r.Status.ToString(), r.IsFinal)).ToList();
        var gpa = formatted.Any(r => r.GradePoint.HasValue) ? Math.Round(formatted.Where(r => r.GradePoint.HasValue).Average(r => r.GradePoint!.Value), 2) : 0m;
        return new StudentReportCardDto(student.StudentNumber, $"{student.FirstName} {student.LastName}".Trim(), formatted, gpa);
    }

    public async Task<FeeReceiptDto?> GenerateFeeReceiptAsync(Guid paymentId, CancellationToken cancellationToken = default)
    {
        var receipt = await (
            from payment in db.Payments.AsNoTracking()
            join invoice in db.StudentInvoices.AsNoTracking() on payment.StudentInvoiceId equals invoice.Id
            where payment.Id == paymentId && payment.StudentInvoiceId.HasValue
            select new FeeReceiptDto(payment.Id, payment.StudentInvoiceId!.Value, invoice.InvoiceNumber, invoice.StudentId,
                payment.ReceiptNumber, payment.Amount, payment.Currency, payment.PaymentMethod,
                payment.Reference ?? string.Empty, payment.PaidAt))
            .FirstOrDefaultAsync(cancellationToken);
        return receipt;
    }

    public async Task<AttendanceReportDto> GenerateAttendanceReportAsync(Guid classId, (DateOnly From, DateOnly To) dateRange, CancellationToken cancellationToken = default)
    {
        var sessions = await (
            from session in db.AttendanceSessions.AsNoTracking()
            join timetable in db.TimetableEntries.AsNoTracking() on session.TimetableEntryId equals timetable.Id
            where timetable.TeachingGroupId == classId && session.SessionDate >= dateRange.From && session.SessionDate <= dateRange.To
            orderby session.SessionDate
            select session).ToListAsync(cancellationToken);

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var records = await db.StudentAttendances.AsNoTracking().Where(a => sessionIds.Contains(a.AttendanceSessionId)).ToListAsync(cancellationToken);
        var summary = records.GroupBy(r => r.Status).ToDictionary(g => g.Key.ToString(), g => g.Count());

        return new AttendanceReportDto(classId, dateRange.From, dateRange.To, sessions.Count, records.Count, summary,
            sessions.Select(s => new AttendanceReportDto.SessionSummary(s.Id, s.SessionDate, s.Status.ToString(), records.Count(r => r.AttendanceSessionId == s.Id))).ToList());
    }

    public async Task<FinancialStatementDto> GenerateFinancialStatementAsync(string? period, CancellationToken cancellationToken = default)
    {
        var normalizedPeriod = string.IsNullOrWhiteSpace(period) ? DateTimeOffset.UtcNow.ToString("yyyy-MM") : period.Trim();
        DateTimeOffset from;
        DateTimeOffset to;

        if (DateTimeOffset.TryParseExact(normalizedPeriod, "yyyy-MM", System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var month))
        {
            from = new DateTimeOffset(month.Year, month.Month, 1, 0, 0, 0, TimeSpan.Zero);
            to = from.AddMonths(1);
        }
        else if (DateTimeOffset.TryParse(normalizedPeriod, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var parsed))
        {
            from = new DateTimeOffset(parsed.Year, parsed.Month, parsed.Day, 0, 0, 0, TimeSpan.Zero);
            to = from.AddDays(1);
        }
        else
        {
            throw new ArgumentException("Period must be in yyyy-MM format or a valid date.", nameof(period));
        }

        var postedLines = await (
            from line in db.JournalEntryLines.AsNoTracking()
            join entry in db.JournalEntries.AsNoTracking() on line.JournalEntryId equals entry.Id
            join account in db.Accounts.AsNoTracking() on line.AccountId equals account.Id
            where entry.Status == "Posted" && entry.EntryDate >= from && entry.EntryDate < to
            select new { account.AccountType, account.Name, line.Debit, line.Credit }).ToListAsync(cancellationToken);

        var revenueGroups = postedLines.Where(x => string.Equals(x.AccountType, "Revenue", StringComparison.OrdinalIgnoreCase))
            .GroupBy(x => x.Name).Select(g => new FinancialStatementDto.PlEntry(g.Key, g.Sum(x => x.Credit - x.Debit)))
            .Where(x => x.Amount != 0m).OrderBy(x => x.Description).ToList();
        var expenseGroups = postedLines.Where(x => string.Equals(x.AccountType, "Expense", StringComparison.OrdinalIgnoreCase))
            .GroupBy(x => x.Name).Select(g => new FinancialStatementDto.PlEntry(g.Key, g.Sum(x => x.Debit - x.Credit)))
            .Where(x => x.Amount != 0m).OrderBy(x => x.Description).ToList();

        var totalRevenue = revenueGroups.Sum(x => x.Amount);
        var totalExpenses = expenseGroups.Sum(x => x.Amount);
        var totalCollected = await db.Payments.AsNoTracking().Where(p => p.PaidAt >= from && p.PaidAt < to)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var outstandingRevenue = await db.StudentInvoices.AsNoTracking().Where(i => i.IssuedAt < to)
            .SumAsync(i => (decimal?)(i.Amount - i.PaidAmount), cancellationToken) ?? 0m;

        var profitAndLoss = revenueGroups.Concat(expenseGroups.Select(x => new FinancialStatementDto.PlEntry(x.Description, -x.Amount))).ToList();
        return new FinancialStatementDto(normalizedPeriod, totalRevenue, totalCollected, totalExpenses,
            Math.Max(0m, outstandingRevenue), totalRevenue - totalExpenses, profitAndLoss);
    }
}
