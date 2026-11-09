using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Api.Services;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Students;
using SchoolManagement.Application.StudentRecords;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/students")]
[Authorize(Policy = AuthorizationPolicies.StudentRead)]
public sealed class StudentsController(StudentService service, SchoolManagementDbContext db, StudentRecordsWorkflowService studentRecords, CampusAccessService campusAccess) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<object>>> GetAll([FromQuery] Guid? campusId, CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var query = db.Students.AsNoTracking().Where(x => !x.IsArchived).AsQueryable();
        if (campusId.HasValue)
        {
            if (accessibleCampuses is not null && !accessibleCampuses.Contains(campusId.Value)) return Forbid();
            query = query.Where(x => x.CampusId == campusId.Value);
        }
        else if (accessibleCampuses is not null)
        {
            query = query.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));
        }
        return Ok(await query.OrderBy(x => x.StudentNumber).ToListAsync(cancellationToken));
    }

    [HttpGet("archived")]
    public async Task<IActionResult> GetArchived([FromQuery] string? search, CancellationToken cancellationToken)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var query = db.Students.AsNoTracking().Where(x => x.IsArchived);
        if (accessibleCampuses is not null)
            query = query.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x =>
                x.StudentNumber.ToLower().Contains(term) ||
                x.FirstName.ToLower().Contains(term) ||
                x.LastName.ToLower().Contains(term) ||
                (x.OtherNames != null && x.OtherNames.ToLower().Contains(term)) ||
                (x.Email != null && x.Email.ToLower().Contains(term)) ||
                (x.PhoneNumber != null && x.PhoneNumber.Contains(term)) ||
                (x.NationalId != null && x.NationalId.ToLower().Contains(term)));
        }
        return Ok(await query.OrderBy(x => x.StudentNumber).ToListAsync(cancellationToken));
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Archive(Guid id, [FromBody] ArchiveStudentRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        var student = await db.Students.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (student is null) return NotFound(new { message = "Student was not found." });
        if (student.IsArchived) return Conflict(new { message = "Student is already archived." });

        student.StatusBeforeArchive = student.Status;
        student.IsArchived = true;
        student.Status = "Archived";
        student.ArchivedAt = DateTimeOffset.UtcNow;
        student.ArchivedBy = User.Identity?.Name ?? "Unknown";
        student.ArchiveReason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { student.Id, student.StudentNumber, student.Status, student.IsArchived, student.ArchivedAt, student.ArchivedBy, student.ArchiveReason });
    }

    [HttpPost("{id:guid}/restore")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Restore(Guid id, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        var student = await db.Students.SingleOrDefaultAsync(x => x.Id == id && x.IsArchived, cancellationToken);
        if (student is null) return NotFound(new { message = "Archived student was not found." });

        student.IsArchived = false;
        student.Status = string.IsNullOrWhiteSpace(student.StatusBeforeArchive) ? "Active" : student.StatusBeforeArchive;
        student.StatusBeforeArchive = null;
        student.ArchivedAt = null;
        student.ArchivedBy = null;
        student.ArchiveReason = null;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { student.Id, student.StudentNumber, student.Status, student.IsArchived });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var student = await service.GetByIdAsync(id, cancellationToken);
        if (student is null) return NotFound();
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        return Ok(student);
    }

    [HttpGet("{id:guid}/guardians")]
    public async Task<IActionResult> GetGuardians(Guid id, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        try { return Ok(await studentRecords.GetGuardiansAsync(id, cancellationToken)); }
        catch (KeyNotFoundException) { return NotFound(new { message = "Student was not found." }); }
    }

    [HttpPost("{id:guid}/guardians")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> AddGuardian(Guid id, AddStudentGuardianRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        try { await studentRecords.RemoveGuardianAsync(id, guardianId, cancellationToken); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }


    [HttpGet("{id:guid}/application-form")]
    public async Task<IActionResult> GetApplicationForm(Guid id, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        var record = await db.StudentApplicationRecords.AsNoTracking().SingleOrDefaultAsync(x => x.StudentId == id, cancellationToken);
        if (record is null) return NotFound();
        return Ok(new { record.Id, record.StudentId, application = System.Text.Json.JsonDocument.Parse(record.ApplicationDataJson).RootElement, record.PhotographContentType, record.PhotographFileName, record.SubmittedAt, record.Status });
    }

    [HttpPut("{id:guid}/application-form")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    [RequestSizeLimit(12_000_000)]
    public async Task<IActionResult> SaveApplicationForm(Guid id, SaveStudentApplicationFormRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
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

        var campusId = await campusAccess.ResolveCampusForWriteAsync(User, request.CampusId, cancellationToken);
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is not null && !campusId.HasValue) return Forbid();
        if (request.CampusId.HasValue && !campusId.HasValue) return Forbid();

        var student = await service.CreateAsync(request with { CampusId = campusId }, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Update(Guid id, UpdateStudentRequest request, CancellationToken cancellationToken)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessStudentAsync(User, id, cancellationToken)) return Forbid();
        var deleted = await service.DeleteAsync(id, cancellationToken);
        return deleted ? NoContent() : NotFound();
    }
}

public sealed record SaveStudentApplicationFormRequest(System.Text.Json.JsonElement Application, string? PhotographBase64 = null, string? PhotographContentType = null, string? PhotographFileName = null);

public sealed record ArchiveStudentRequest(string? Reason = null);
