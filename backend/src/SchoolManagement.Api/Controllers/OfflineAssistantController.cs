using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/assistant")]
[Authorize]
public sealed class OfflineAssistantController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<AssistantResponse>> Ask([FromBody] AssistantRequest request, CancellationToken ct)
    {
        var q = request.Question?.Trim() ?? string.Empty;
        if (q.Length < 2) return BadRequest("Ask a question.");
        var students = await db.Students.AsNoTracking().ToListAsync(ct);
        var invoices = await db.StudentInvoices.AsNoTracking().ToListAsync(ct);
        var attendance = await db.StudentAttendances.AsNoTracking().ToListAsync(ct);
        var assessments = await db.StudentAssessments.AsNoTracking().ToListAsync(ct);
        var admissions = await db.Admissions.AsNoTracking().ToListAsync(ct);
        var present = attendance.Count(x => x.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
        var attendanceRate = attendance.Count == 0 ? 0 : Math.Round(present * 100m / attendance.Count, 1);
        var average = assessments.Count == 0 ? 0 : Math.Round(assessments.Average(x => x.MaximumScore == 0 ? 0 : x.Score * 100m / x.MaximumScore), 1);
        var outstanding = invoices.Sum(x => x.Amount - x.PaidAmount);
        string answer;
        if (q.Contains("student", StringComparison.OrdinalIgnoreCase) || q.Contains("enrol", StringComparison.OrdinalIgnoreCase)) answer = $"The local SMIS database currently contains {students.Count} students, of whom {students.Count(x => x.Status.Equals("Active", StringComparison.OrdinalIgnoreCase))} are active.";
        else if (q.Contains("admission", StringComparison.OrdinalIgnoreCase)) answer = $"There are {admissions.Count(x => x.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))} pending admissions.";
        else if (q.Contains("attendance", StringComparison.OrdinalIgnoreCase)) answer = $"Recorded institution-wide attendance is {attendanceRate}%.";
        else if (q.Contains("fee", StringComparison.OrdinalIgnoreCase) || q.Contains("balance", StringComparison.OrdinalIgnoreCase)) answer = $"The recorded outstanding student-invoice balance is UGX {outstanding:N0}.";
        else if (q.Contains("mark", StringComparison.OrdinalIgnoreCase) || q.Contains("score", StringComparison.OrdinalIgnoreCase) || q.Contains("exam", StringComparison.OrdinalIgnoreCase)) answer = $"The average recorded assessment percentage is {average}%.";
        else answer = "I can answer local questions about students, admissions, attendance, fees, assessments and institutional status. No cloud AI service is required for this assistant.";
        return Ok(new AssistantResponse(answer, DateTimeOffset.UtcNow, "local-rules"));
    }
}
public sealed record AssistantRequest(string Question);
public sealed record AssistantResponse(string Answer, DateTimeOffset GeneratedAt, string Engine);
