using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.CampusServices;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/health-records")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public sealed class HealthRecordsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentMedicalRecords(Guid studentId, CancellationToken cancellationToken)
    {
        var records = await db.Set<StudentMedicalRecord>().AsNoTracking()
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.VisitDate)
            .Select(r => new
            {
                r.Id, r.RecordType, r.Condition, r.Treatment, r.Medication, r.Notes,
                r.AttendedBy, r.VisitDate, r.CreatedAtUtc
            })
            .ToListAsync(cancellationToken);
        return Ok(records);
    }

    [HttpPost("student/{studentId:guid}")]
    public async Task<IActionResult> AddMedicalRecord(Guid studentId, [FromBody] AddMedicalRecordRequest request, CancellationToken cancellationToken)
    {
        var record = new StudentMedicalRecord
        {
            StudentId = studentId, RecordType = request.RecordType, Condition = request.Condition,
            Treatment = request.Treatment, Medication = request.Medication, Notes = request.Notes,
            AttendedBy = request.AttendedBy, VisitDate = request.VisitDate
        };
        db.Set<StudentMedicalRecord>().Add(record);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetStudentMedicalRecords), new { studentId }, new { record.Id });
    }

    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentVisits([FromQuery] int days = 7, CancellationToken cancellationToken = default)
    {
        if (days < 1 || days > 365) return BadRequest(new { message = "Days must be between 1 and 365." });
        var since = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-days));
        var visits = await (
            from record in db.Set<StudentMedicalRecord>().AsNoTracking()
            join student in db.Students.AsNoTracking() on record.StudentId equals student.Id
            where record.VisitDate >= since
            orderby record.VisitDate descending
            select new
            {
                record.Id, studentId = student.Id, studentNumber = student.StudentNumber,
                studentName = student.FirstName + " " + student.LastName,
                record.RecordType, record.Condition, record.Treatment, record.VisitDate, record.AttendedBy
            })
            .ToListAsync(cancellationToken);
        return Ok(visits);
    }
}

public sealed record AddMedicalRecordRequest(string RecordType, string? Condition, string? Treatment, string? Medication, string? Notes, string? AttendedBy, DateOnly VisitDate);
