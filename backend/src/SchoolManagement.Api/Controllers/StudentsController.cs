using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Students;
using SchoolManagement.Application.StudentRecords;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/students")]
[Authorize(Policy = AuthorizationPolicies.StudentRead)]
public sealed class StudentsController(StudentService service, SchoolManagementDbContext db, StudentRecordsWorkflowService studentRecords) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<object>>> GetAll(CancellationToken cancellationToken)
    {
        var students = await service.GetAllAsync(cancellationToken);
        return Ok(students);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var student = await service.GetByIdAsync(id, cancellationToken);
        return student is null ? NotFound() : Ok(student);
    }

    [HttpGet("{id:guid}/guardians")]
    public async Task<IActionResult> GetGuardians(Guid id, CancellationToken cancellationToken)
    {
        try { return Ok(await studentRecords.GetGuardiansAsync(id, cancellationToken)); }
        catch (KeyNotFoundException) { return NotFound(new { message = "Student was not found." }); }
    }

    [HttpPost("{id:guid}/guardians")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> AddGuardian(Guid id, AddStudentGuardianRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var guardian = await studentRecords.AddGuardianAsync(id, request, cancellationToken);
            return Created($"/api/students/{id}/guardians/{guardian.Id}", guardian);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPut("{id:guid}/guardians/{guardianId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> UpdateGuardian(Guid id, Guid guardianId, UpdateStudentGuardianRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var guardian = await studentRecords.UpdateGuardianAsync(id, guardianId, request, cancellationToken);
            return Ok(guardian);
        }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpDelete("{id:guid}/guardians/{guardianId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> DeleteGuardian(Guid id, Guid guardianId, CancellationToken cancellationToken)
    {
        try { await studentRecords.RemoveGuardianAsync(id, guardianId, cancellationToken); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }


    [HttpGet("{id:guid}/application-form")]
    public async Task<IActionResult> GetApplicationForm(Guid id, CancellationToken cancellationToken)
    {
        var record = await db.StudentApplicationRecords.AsNoTracking().SingleOrDefaultAsync(x => x.StudentId == id, cancellationToken);
        if (record is null) return NotFound();
        return Ok(new { record.Id, record.StudentId, application = System.Text.Json.JsonDocument.Parse(record.ApplicationDataJson).RootElement, record.PhotographContentType, record.PhotographFileName, record.SubmittedAt, record.Status });
    }

    [HttpPut("{id:guid}/application-form")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    [RequestSizeLimit(12_000_000)]
    public async Task<IActionResult> SaveApplicationForm(Guid id, SaveStudentApplicationFormRequest request, CancellationToken cancellationToken)
    {
        if (!await db.Students.AnyAsync(x => x.Id == id, cancellationToken)) return NotFound(new { message = "Student was not found." });
        if (request.Application.ValueKind != System.Text.Json.JsonValueKind.Object) return BadRequest(new { message = "Application data must be a JSON object." });
        byte[]? photograph = null;
        if (!string.IsNullOrWhiteSpace(request.PhotographBase64))
        {
            try { photograph = Convert.FromBase64String(request.PhotographBase64); }
            catch (FormatException) { return BadRequest(new { message = "The photograph data is not valid base64." }); }
            if (photograph.Length > 8 * 1024 * 1024) return BadRequest(new { message = "Photograph must be 8 MB or smaller." });
            if (string.IsNullOrWhiteSpace(request.PhotographContentType) || !request.PhotographContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "Photograph must be an image." });
        }

        var record = await db.StudentApplicationRecords.SingleOrDefaultAsync(x => x.StudentId == id, cancellationToken);
        if (record is null)
        {
            record = new SchoolManagement.Domain.Admissions.StudentApplicationRecord { StudentId = id, ApplicationDataJson = request.Application.GetRawText(), PhotographData = photograph, PhotographContentType = request.PhotographContentType, PhotographFileName = request.PhotographFileName };
            db.StudentApplicationRecords.Add(record);
        }
        else
        {
            record.ApplicationDataJson = request.Application.GetRawText();
            if (request.PhotographBase64 is not null)
            {
                record.PhotographData = photograph;
                record.PhotographContentType = request.PhotographContentType;
                record.PhotographFileName = request.PhotographFileName;
            }
            record.Status = "Submitted";
        }
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { record.Id, record.StudentId, record.SubmittedAt, record.Status });
    }

    [HttpGet("{id:guid}/application-form/photograph")]
    public async Task<IActionResult> GetApplicationPhotograph(Guid id, CancellationToken cancellationToken)
    {
        var record = await db.StudentApplicationRecords.AsNoTracking().SingleOrDefaultAsync(x => x.StudentId == id, cancellationToken);
        if (record?.PhotographData is null || string.IsNullOrWhiteSpace(record.PhotographContentType)) return NotFound();
        return File(record.PhotographData, record.PhotographContentType);
    }

    [HttpGet("{id:guid}/qrcode")]
    [AllowAnonymous]
    public async Task<IActionResult> GetQrCode(Guid id, CancellationToken cancellationToken)
    {
        var student = await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (student is null) return NotFound();

        if (System.Text.Encoding.UTF8.GetByteCount(student.StudentNumber) > 19)
            return BadRequest(new { message = "The student number is too long for the current QR encoder." });

        var qr = QrCodeHelper.GenerateSvg(student.StudentNumber);
        return Content(qr, "image/svg+xml");
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Create(CreateStudentRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.StudentNumber) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName))
        {
            return BadRequest(new { message = "Student number, first name, and last name are required." });
        }

        var student = await service.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Update(Guid id, UpdateStudentRequest request, CancellationToken cancellationToken)
    {
        if (id != request.Id)
            return BadRequest(new { message = "Route ID and body ID must match." });

        if (string.IsNullOrWhiteSpace(request.StudentNumber) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName))
        {
            return BadRequest(new { message = "Student number, first name, and last name are required." });
        }

        var updated = await service.UpdateAsync(request, cancellationToken);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await service.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}

public sealed record SaveStudentApplicationFormRequest(System.Text.Json.JsonElement Application, string? PhotographBase64 = null, string? PhotographContentType = null, string? PhotographFileName = null);
