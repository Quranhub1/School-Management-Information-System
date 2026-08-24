using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admissions")]
public sealed class AdmissionsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AdmissionsPolicies.Read)]
    public async Task<IActionResult> List([FromQuery] string? status, CancellationToken cancellationToken)
    {
        var query = db.Applicants.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        return Ok(await query.OrderByDescending(x => x.AppliedAt).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = AdmissionsPolicies.Read)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var applicant = await db.Applicants.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return applicant is null ? NotFound() : Ok(applicant);
    }

    [HttpPost]
    [Authorize(Policy = AdmissionsPolicies.Management)]
    public async Task<IActionResult> Submit(CreateApplicantRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName))
            return BadRequest(new { message = "First name and last name are required." });

        if (request.Email is not null && await db.Applicants.AnyAsync(x => x.Email == request.Email && x.Status != "Rejected", cancellationToken))
            return Conflict(new { message = "An active application already exists for this email." });

        var applicant = new Applicant
        {
            ApplicationNumber = $"APP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..20],
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            OtherNames = request.OtherNames,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            NationalId = request.NationalId,
            PhoneNumber = request.PhoneNumber,
            Email = request.Email,
            Status = "Submitted"
        };
        db.Applicants.Add(applicant);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/admissions/{applicant.Id}", applicant);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = AdmissionsPolicies.Management)]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateAdmissionStatusRequest request, CancellationToken cancellationToken)
    {
        var applicant = await db.Applicants.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (applicant is null) return NotFound();
        var allowed = new[] { "Submitted", "UnderReview", "Accepted", "Rejected", "Withdrawn" };
        if (!allowed.Contains(request.Status, StringComparer.OrdinalIgnoreCase)) return BadRequest(new { message = "Invalid admission status." });
        applicant.Status = allowed.First(x => x.Equals(request.Status, StringComparison.OrdinalIgnoreCase));
        await db.SaveChangesAsync(cancellationToken);
        return Ok(applicant);
    }

    [HttpPost("{id:guid}/admit")]
    [Authorize(Policy = AdmissionsPolicies.Management)]
    public async Task<IActionResult> Admit(Guid id, AdmitApplicantRequest request, CancellationToken cancellationToken)
    {
        var applicant = await db.Applicants.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (applicant is null) return NotFound();
        if (!string.Equals(applicant.Status, "Accepted", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Only an accepted application can be admitted." });
        if (!await db.Programmes.AnyAsync(x => x.Id == request.ProgrammeId, cancellationToken))
            return BadRequest(new { message = "The selected programme does not exist." });
        if (!await db.Intakes.AnyAsync(x => x.Id == request.IntakeId, cancellationToken))
            return BadRequest(new { message = "The selected intake does not exist." });
        if (request.AcademicYearId.HasValue && !await db.AcademicYears.AnyAsync(x => x.Id == request.AcademicYearId.Value, cancellationToken))
            return BadRequest(new { message = "The selected academic year does not exist." });
        if (await db.Admissions.AnyAsync(x => x.ApplicantId == id && x.Status == "Admitted", cancellationToken))
            return Conflict(new { message = "This applicant has already been admitted." });
        if (await db.Students.AnyAsync(x => x.StudentNumber == request.StudentNumber, cancellationToken))
            return Conflict(new { message = "The student number is already in use." });

        var student = new Student
        {
            StudentNumber = request.StudentNumber.Trim(),
            FirstName = applicant.FirstName,
            LastName = applicant.LastName,
            OtherNames = applicant.OtherNames,
            DateOfBirth = applicant.DateOfBirth,
            Gender = applicant.Gender,
            NationalId = applicant.NationalId,
            PhoneNumber = applicant.PhoneNumber,
            Email = applicant.Email,
            AdmissionId = applicant.Id,
            Status = "Active"
        };

        var admission = new Admission
        {
            ApplicantId = applicant.Id,
            StudentId = student.Id,
            ProgrammeId = request.ProgrammeId,
            IntakeId = request.IntakeId,
            AcademicYearId = request.AcademicYearId,
            AdmissionNumber = request.AdmissionNumber.Trim(),
            AdmissionType = request.AdmissionType.Trim(),
            Status = "Admitted",
            AdmittedAt = DateTimeOffset.UtcNow,
            ReportingDate = request.ReportingDate,
            DecisionReference = request.DecisionReference?.Trim()
        };

        var enrollment = new StudentEnrollment
        {
            StudentId = student.Id,
            ProgrammeId = request.ProgrammeId,
            IntakeId = request.IntakeId,
            AdmissionDate = request.ReportingDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Status = "Active",
            CurrentYear = 1
        };

        db.Students.Add(student);
        db.Admissions.Add(admission);
        db.StudentEnrollments.Add(enrollment);
        applicant.Status = "Admitted";
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/students/{student.Id}", new { student, admission, enrollment });
    }
}

public sealed record CreateApplicantRequest(string FirstName, string LastName, string? OtherNames, DateOnly? DateOfBirth, string? Gender, string? NationalId, string? PhoneNumber, string? Email);
public sealed record UpdateAdmissionStatusRequest(string Status);
public sealed record AdmitApplicantRequest(Guid ProgrammeId, Guid IntakeId, Guid? AcademicYearId, string StudentNumber, string AdmissionNumber, string AdmissionType, DateOnly? ReportingDate, string? DecisionReference);
