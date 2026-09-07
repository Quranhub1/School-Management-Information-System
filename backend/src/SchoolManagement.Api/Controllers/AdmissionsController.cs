using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admissions")]
[Authorize(Policy = AdmissionsPolicies.Management)]
public sealed class AdmissionsController(AdmissionsWorkflowService workflow)
    : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateAdmissionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var admission = await workflow.CreateAsync(request, cancellationToken);
            return Created($"/api/admissions/{admission.Id}", admission);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/decision")]
    public async Task<IActionResult> Decide(
        Guid id,
        DecideAdmissionRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var decision = await workflow.DecideAsync(id, request, cancellationToken);
            return Ok(decision);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
