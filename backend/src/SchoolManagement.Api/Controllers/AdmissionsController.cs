using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admissions")]
[Authorize(Policy = AdmissionsPolicies.Management)]
public sealed class AdmissionsController(AdmissionsWorkflowService workflow, SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdmissionDto>>> GetAll(CancellationToken cancellationToken) => Ok(await workflow.GetAllAsync(cancellationToken));
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken) { var admission = await workflow.GetByIdAsync(id, cancellationToken); return admission is null ? NotFound() : Ok(admission); }
    [HttpPost]
    public async Task<IActionResult> Create(CreateAdmissionRequest request, CancellationToken cancellationToken) { try { var admission = await workflow.CreateAsync(request, cancellationToken); return Created($"/api/admissions/{admission.Id}", admission); } catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); } }
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateAdmissionRequest request, CancellationToken cancellationToken) { if (id != request.Id) return BadRequest(new { message = "Route ID and body ID must match." }); var updated = await workflow.UpdateAsync(id, request, cancellationToken); return updated is null ? NotFound() : Ok(updated); }
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken) => await workflow.DeleteAsync(id, cancellationToken) ? NoContent() : NotFound();
    [HttpPost("{id:guid}/decision")]
    public async Task<IActionResult> Decide(Guid id, DecideAdmissionRequest request, CancellationToken cancellationToken) { try { return Ok(await workflow.DecideAsync(id, request, cancellationToken)); } catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); } catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); } }

    [HttpPost("{id:guid}/admit")]
    public async Task<IActionResult> Admit(Guid id, AdmitApplicantRequest request, CancellationToken cancellationToken)
    {
        var applicant = await db.Applicants.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (applicant is null) return NotFound();
        if (!string.Equals(applicant.Status, "Accepted", StringComparison.OrdinalIgnoreCase)) return Conflict(new { message = "Only an accepted application can be admitted." });
        if (!await db.Programmes.AnyAsync(x => x.Id == request.ProgrammeId, cancellationToken)) return BadRequest(new { message = "The selected programme does not exist." });
        if (!await db.Intakes.AnyAsync(x => x.Id == request.IntakeId, cancellationToken)) return BadRequest(new { message = "The selected intake does not exist." });
        if (!await db.AcademicYears.AnyAsync(x => x.Id == request.AcademicYearId, cancellationToken)) return BadRequest(new { message = "The selected academic year does not exist." });

        var admission = await db.Admissions.SingleOrDefaultAsync(x => x.ApplicantId == id && x.ProgrammeId == request.ProgrammeId && x.IntakeId == request.IntakeId && x.AcademicYearId == request.AcademicYearId, cancellationToken);
        if (admission is null) return Conflict(new { message = "No matching admission record exists for this accepted application." });
        if (string.Equals(admission.Status, "Admitted", StringComparison.OrdinalIgnoreCase)) return Conflict(new { message = "This applicant has already been admitted." });
        if (!string.Equals(admission.Status, "Accepted", StringComparison.OrdinalIgnoreCase)) return Conflict(new { message = "The matching admission is not accepted." });

        var studentNumber = request.StudentNumber.Trim();
        if (string.IsNullOrWhiteSpace(studentNumber)) return BadRequest(new { message = "Student number is required." });
        var student = await db.Students.SingleOrDefaultAsync(x => x.AdmissionId == admission.Id, cancellationToken);
        if (student is null)
        {
            if (await db.Students.AnyAsync(x => x.StudentNumber == studentNumber, cancellationToken)) return Conflict(new { message = "The student number is already in use." });
            student = new Student { StudentNumber = studentNumber, FirstName = applicant.FirstName, LastName = applicant.LastName, OtherNames = applicant.OtherNames, DateOfBirth = applicant.DateOfBirth, Gender = applicant.Gender, NationalId = applicant.NationalId, PhoneNumber = applicant.PhoneNumber, Email = applicant.Email, AdmissionId = admission.Id, Status = "Active" };
            db.Students.Add(student);
        }
        else if (!string.Equals(student.StudentNumber, studentNumber, StringComparison.OrdinalIgnoreCase))
        {
            if (await db.Students.AnyAsync(x => x.Id != student.Id && x.StudentNumber == studentNumber, cancellationToken)) return Conflict(new { message = "The student number is already in use." });
            student.StudentNumber = studentNumber;
        }

        var enrollment = await db.StudentEnrollments.SingleOrDefaultAsync(x => x.StudentId == student.Id && x.ProgrammeId == request.ProgrammeId && x.IntakeId == request.IntakeId, cancellationToken);
        if (enrollment is null)
        {
            enrollment = new StudentEnrollment { StudentId = student.Id, ProgrammeId = request.ProgrammeId, IntakeId = request.IntakeId, AdmissionDate = request.ReportingDate ?? DateOnly.FromDateTime(DateTime.UtcNow), Status = "Active", CurrentYear = 1 };
            db.StudentEnrollments.Add(enrollment);
        }
        else
        {
            enrollment.Status = "Active";
        }
        admission.Status = "Admitted";
        applicant.Status = "Admitted";
        await db.SaveChangesAsync(cancellationToken);
        return Created($"/api/students/{student.Id}", new { student, admission, enrollment });
    }
}

public sealed record AdmitApplicantRequest(Guid ProgrammeId, Guid IntakeId, Guid AcademicYearId, string StudentNumber, string? AdmissionNumber, string? AdmissionType, DateOnly? ReportingDate, string? DecisionReference);
public record CreateAdmissionRequirementRequest(Guid ProgrammeId, string RequirementType, string Description, bool IsMandatory, int DisplayOrder);
