using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/admission-documents")]
[Authorize(Policy = AdmissionsPolicies.Read)]
public sealed class AdmissionDocumentsController(SchoolManagementDbContext db, IWebHostEnvironment environment) : ControllerBase
{
    private const long MaxUploadBytes = 25_000_000;
    private static readonly IReadOnlyDictionary<string, string[]> AllowedTypes = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = ["application/pdf"],
        [".jpg"] = ["image/jpeg"],
        [".jpeg"] = ["image/jpeg"],
        [".png"] = ["image/png"]
    };

    [HttpPost("applicant/{applicantId:guid}")]
    [Authorize(Policy = AdmissionsPolicies.Management)]
    [RequestSizeLimit(MaxUploadBytes)]
    public async Task<ActionResult<object>> Upload(Guid applicantId, IFormFile file, CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest("A scanned admission document is required.");
        if (file.Length > MaxUploadBytes) return BadRequest("The admission document exceeds the 25 MB limit.");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedTypes.TryGetValue(extension, out var contentTypes) || !contentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
            return BadRequest("Only PDF, JPEG, and PNG admission documents are allowed.");

        var admission = await db.Admissions.AsNoTracking().FirstOrDefaultAsync(x => x.ApplicantId == applicantId, ct);
        if (admission is null) return NotFound("Admission record not found for applicant.");

        var root = Path.Combine(environment.ContentRootPath, "App_Data", "Admissions", admission.Id.ToString("N"));
        Directory.CreateDirectory(root);

        var storedName = $"admission-form_{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var path = Path.Combine(root, storedName);
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
