using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admission-documents")]
[Authorize]
public sealed class AdmissionDocumentsController(SchoolManagementDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    [HttpPost("applicant/{applicantId:guid}")]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult<object>> Upload(Guid applicantId, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("A scanned admission document is required.");
        var admission = await db.Admissions.AsNoTracking().FirstOrDefaultAsync(x => x.ApplicantId == applicantId, ct);
        if (admission is null) return NotFound("Admission record not found for applicant.");
        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Admissions", admission.Id.ToString("N"));
        Directory.CreateDirectory(root);
        var safe = Path.GetFileName(file.FileName);
        var path = Path.Combine(root, $"admission-form_{DateTime.UtcNow:yyyyMMddHHmmssfff}_{safe}");
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream, ct);
        var info = new FileInfo(path);
        return Ok(new { admissionId = admission.Id, fileName = info.Name, sizeBytes = info.Length, storedAtUtc = info.LastWriteTimeUtc });
    }

    [HttpGet("applicant/{applicantId:guid}")]
    public async Task<ActionResult<IReadOnlyList<object>>> List(Guid applicantId, CancellationToken ct)
    {
        var admission = await db.Admissions.AsNoTracking().FirstOrDefaultAsync(x => x.ApplicantId == applicantId, ct);
        if (admission is null) return Ok(Array.Empty<object>());
        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Admissions", admission.Id.ToString("N"));
        if (!Directory.Exists(root)) return Ok(Array.Empty<object>());
        var result = Directory.EnumerateFiles(root).Select(x => new { fileName = Path.GetFileName(x), sizeBytes = new FileInfo(x).Length }).ToList();
        return Ok(result);
    }
}
