using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Reporting;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Infrastructure.Reporting;

public sealed class ReportGenerator(SchoolManagementDbContext db) : IReportGenerator
{
    public async Task<StudentReportCardDto> GenerateStudentReportCardAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        var student = await db.Students.AsNoTracking().FirstOrDefaultAsync(s => s.Id == studentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Student {studentId} was not found.");

        var results = await db.AssessmentResults.AsNoTracking()
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return new StudentReportCardDto(student.Id, student.AdmissionNumber, student.FirstName, student.LastName,
            results.Select(r => new StudentReportCardDto.SubjectResult(r.SubjectId, r.Score, r.Grade)).ToList());
    }

    public async Task<FeeReceiptDto> GenerateFeeReceiptAsync(Guid paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await db.Payments.AsNoTracking().FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken)
            ?? throw new KeyNotFoundException($"Payment {paymentId} was not found.");

        if (!payment.StudentInvoiceId.HasValue)
            throw new InvalidOperationException("An invoice-backed payment is required to generate a fee receipt.");

        var invoice = await db.StudentInvoices.AsNoTracking().FirstOrDefaultAsync(i => i.Id == payment.StudentInvoiceId.Value, cancellationToken)
            ?? throw new KeyNotFoundException($"Invoice {payment.StudentInvoiceId.Value} was not found.");

        return new FeeReceiptDto(payment.Id, invoice.Id, payment.Amount, payment.PaidAt, payment.Method.ToString(), invoice.Description);
    }

    public async Task<AttendanceReportDto> GenerateAttendanceReportAsync(Guid classId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken = default)
    {
        var dateRange = from.HasValue && to.HasValue
            ? (From: from.Value, To: to.Value)
            : (DateOnly.FromDateTime(DateTime.UtcNow.Date), DateOnly.FromDateTime(DateTime.UtcNow.Date));

        var sessions = await db.AttendanceSessions.AsNoTracking()
            .Where(s => s.ClassId == classId && s.SessionDate >= dateRange.From && s.SessionDate <= dateRange.To)
            .OrderBy(s => s.SessionDate)
            .ToListAsync(cancellationToken);

        var sessionIds = sessions.Select(s => s.Id).ToList();
        var records = await db.StudentAttendances.AsNoTracking().Where(a => sessionIds.Contains(a.AttendanceSessionId)).ToListAsync(cancellationToken);
        var summary = records.GroupBy(r => r.Status).ToDictionary(g => g.Key.ToString(), g => g.Count());

        return new AttendanceReportDto(classId, dateRange.From, dateRange.To, sessions.Count, records.Count, summary,
            sessions.Select(s => new AttendanceReportDto.SessionSummary(s.Id, s.SessionDate, s.Status.ToString(), records.Count(r => r.AttendanceSessionId == s.Id))).ToList());
    }

    public async Task<FinancialStatementDto> GenerateFinancialStatementAsync(string? period, CancellationToken cancellationToken = default)
    {
        var normalizedPeriod = string.IsNullOrWhiteSpace(period) ? DateTimeOffset.UtcNow.ToString("yyyy-MM") : period.Trim();
        DateTimeOffset startDate;
        DateTimeOffset endDate;

        if (DateTimeOffset.TryParseExact(normalizedPeriod, "yyyy-MM", System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var month))
        {
            startDate = new DateTimeOffset(month.Year, month.Month, 1, 0, 0, 0, TimeSpan.Zero);
            endDate = startDate.AddMonths(1);
        }
        else if (DateTimeOffset.TryParse(normalizedPeriod, System.Globalization.CultureInfo.InvariantCulture,
            System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var parsed))
        {
            startDate = new DateTimeOffset(parsed.Year, parsed.Month, parsed.Day, 0, 0, 0, TimeSpan.Zero);
            endDate = startDate.AddDays(1);
        }
        else
        {
            throw new ArgumentException("Period must be in yyyy-MM format or a valid date.", nameof(period));
        }

        var postedLines = await (
            from line in db.JournalEntryLines.AsNoTracking()
            join entry in db.JournalEntries.AsNoTracking() on line.JournalEntryId equals entry.Id
            join account in db.Accounts.AsNoTracking() on line.AccountId equals account.Id
            where entry.Status == "Posted" && entry.EntryDate >= startDate && entry.EntryDate < endDate
            select new { account.AccountType, account.Name, line.Debit, line.Credit }).ToListAsync(cancellationToken);

        var revenueGroups = postedLines.Where(x => string.Equals(x.AccountType, "Revenue", StringComparison.OrdinalIgnoreCase))
            .GroupBy(x => x.Name).Select(g => new FinancialStatementDto.PlEntry(g.Key, g.Sum(x => x.Credit - x.Debit)))
            .Where(x => x.Amount != 0m).OrderBy(x => x.Description).ToList();
        var expenseGroups = postedLines.Where(x => string.Equals(x.AccountType, "Expense", StringComparison.OrdinalIgnoreCase))
            .GroupBy(x => x.Name).Select(g => new FinancialStatementDto.PlEntry(g.Key, g.Sum(x => x.Debit - x.Credit)))
            .Where(x => x.Amount != 0m).OrderBy(x => x.Description).ToList();

        var totalRevenue = revenueGroups.Sum(x => x.Amount);
        var totalExpenses = expenseGroups.Sum(x => x.Amount);
        var totalCollected = await db.Payments.AsNoTracking().Where(p => p.PaidAt >= startDate && p.PaidAt < endDate)
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
        var outstandingRevenue = await db.StudentInvoices.AsNoTracking().Where(i => i.IssuedAt < endDate)
            .SumAsync(i => (decimal?)(i.Amount - i.PaidAmount), cancellationToken) ?? 0m;

        var profitAndLoss = revenueGroups.Concat(expenseGroups.Select(x => new FinancialStatementDto.PlEntry(x.Description, -x.Amount))).ToList();
        return new FinancialStatementDto(normalizedPeriod, totalRevenue, totalCollected, totalExpenses,
            Math.Max(0m, outstandingRevenue), totalRevenue - totalExpenses, profitAndLoss);
    }
}
