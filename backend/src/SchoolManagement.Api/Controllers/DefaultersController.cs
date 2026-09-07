using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/defaulters")]
[Authorize(Policy = AuthorizationPolicies.FinanceRead)]
public sealed class DefaultersController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("overview")]
    public async Task<IActionResult> GetOverview(CancellationToken cancellationToken)
    {
        var totalOutstanding = await db.StudentInvoices.AsNoTracking()
            .SumAsync(x => (decimal?)(x.Amount - x.PaidAmount), cancellationToken) ?? 0m;

        var totalDefaulters = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .Select(x => x.StudentId)
            .Distinct()
            .LongCountAsync(cancellationToken);

        var criticalCount = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount && x.IssuedAt.Date < DateTime.UtcNow.AddDays(-60))
            .Select(x => x.StudentId)
            .Distinct()
            .LongCountAsync(cancellationToken);

        var warningCount = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount && x.IssuedAt.Date >= DateTime.UtcNow.AddDays(-60) && x.IssuedAt.Date < DateTime.UtcNow.AddDays(-30))
            .Select(x => x.StudentId)
            .Distinct()
            .LongCountAsync(cancellationToken);

        return Ok(new
        {
            totalOutstanding,
            totalDefaulters,
            criticalCount,
            warningCount
        });
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetDefaulters([FromQuery] string? severity, CancellationToken cancellationToken)
    {
        var query = db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(severity))
        {
            if (severity == "Critical")
            {
                query = query.Where(x => x.IssuedAt.Date < DateTime.UtcNow.AddDays(-60));
            }
            else if (severity == "Warning")
            {
                query = query.Where(x => x.IssuedAt.Date >= DateTime.UtcNow.AddDays(-60) && x.IssuedAt.Date < DateTime.UtcNow.AddDays(-30));
            }
            else if (severity == "Recent")
            {
                query = query.Where(x => x.IssuedAt.Date >= DateTime.UtcNow.AddDays(-30));
            }
        }

        var defaulters = await query
            .GroupBy(x => x.StudentId)
            .Select(g => new
            {
                studentId = g.Key,
                totalBalance = g.Sum(x => x.Amount - x.PaidAmount),
                currency = g.First().Currency,
                oldestInvoice = g.Min(x => x.IssuedAt),
                invoiceCount = g.Count(),
                severity = g.Min(x => x.IssuedAt) < DateTime.UtcNow.AddDays(-60) ? "Critical" :
                           g.Min(x => x.IssuedAt) < DateTime.UtcNow.AddDays(-30) ? "Warning" : "Recent"
            })
            .OrderByDescending(x => x.totalBalance)
            .ToListAsync(cancellationToken);

        var studentIds = defaulters.Select(x => x.studentId).Distinct().ToList();
        var students = await db.Students.AsNoTracking()
            .Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.StudentNumber, s.FirstName, s.LastName, s.OtherNames })
            .ToListAsync(cancellationToken);

        var result = defaulters.Select(d =>
        {
            var student = students.FirstOrDefault(s => s.Id == d.studentId);
            return new
            {
                d.studentId,
                studentNumber = student?.StudentNumber,
                studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(),
                d.totalBalance,
                d.currency,
                d.oldestInvoice,
                d.invoiceCount,
                d.severity
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentDefaulterDetails(Guid studentId, CancellationToken cancellationToken)
    {
        var invoices = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.StudentId == studentId && x.PaidAmount < x.Amount)
            .OrderByDescending(x => x.IssuedAt)
            .Select(x => new
            {
                x.Id,
                x.InvoiceNumber,
                x.FeeType,
                x.Amount,
                x.PaidAmount,
                balance = x.Amount - x.PaidAmount,
                x.Currency,
                x.Status,
                x.IssuedAt,
                daysOverdue = DateTime.UtcNow.Date < x.IssuedAt.Date ? 0 : (DateTime.UtcNow.Date - x.IssuedAt.Date).Days
            })
            .ToListAsync(cancellationToken);

        if (!invoices.Any()) return NotFound(new { message = "No outstanding balances found for this student." });

        var student = await db.Students.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == studentId, cancellationToken);

        return Ok(new
        {
            studentId,
            studentNumber = student?.StudentNumber,
            studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(),
            totalBalance = invoices.Sum(x => x.balance),
            invoices
        });
    }

    [HttpGet("actions")]
    public async Task<IActionResult> GetFollowUpActions(CancellationToken cancellationToken)
    {
        var defaulters = await db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .GroupBy(x => x.StudentId)
            .Select(g => new
            {
                studentId = g.Key,
                oldestInvoice = g.Min(x => x.IssuedAt),
                totalBalance = g.Sum(x => x.Amount - x.PaidAmount)
            })
            .OrderBy(x => x.oldestInvoice)
            .ThenByDescending(x => x.totalBalance)
            .ToListAsync(cancellationToken);

        var studentIds = defaulters.Select(x => x.studentId).Distinct().ToList();
        var students = await db.Students.AsNoTracking()
            .Where(s => studentIds.Contains(s.Id))
            .Select(s => new { s.Id, s.FirstName, s.LastName, s.OtherNames })
            .ToListAsync(cancellationToken);

        var actions = defaulters.Select(d =>
        {
            var student = students.FirstOrDefault(s => s.Id == d.studentId);
            var severity = d.oldestInvoice < DateTime.UtcNow.AddDays(-60) ? "Critical" :
                           d.oldestInvoice < DateTime.UtcNow.AddDays(-30) ? "Warning" : "Recent";
            return new
            {
                d.studentId,
                studentName = student is null ? null : $"{student.FirstName} {student.OtherNames} {student.LastName}".Trim(),
                d.totalBalance,
                severity,
                suggestedActions = severity switch
                {
                    "Critical" => new[] { "Send final notice", "Suspend student", "Report to bursar", "Legal action" },
                    "Warning" => new[] { "Send reminder SMS", "Call parent/guardian", "Payment plan offer" },
                    _ => new[] { "Send payment reminder", "Follow up next week" }
                }
            };
        }).ToList();

        return Ok(actions);
    }
}
