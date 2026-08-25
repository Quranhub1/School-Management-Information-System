using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.ImportExport;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/import-export")]
public sealed class ImportExportController(BulkImportService importExportService) : ControllerBase
{
    [HttpPost("import")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Import([FromBody] BulkImportRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.CsvData) || string.IsNullOrWhiteSpace(request.EntityType))
            return BadRequest(new { message = "EntityType and CsvData are required." });

        var entityType = request.EntityType.Trim().ToLowerInvariant();
        BulkImportResult result = entityType switch
        {
            "student" => await importExportService.ImportStudentsAsync(request, cancellationToken),
            "staff" => await importExportService.ImportStaffAsync(request, cancellationToken),
            _ => throw new NotSupportedException($"Entity type '{request.EntityType}' is not supported.")
        };

        return Ok(new { request.EntityType, result.SuccessCount, result.ErrorCount, Errors = result.Errors, Warnings = result.Warnings });
    }

    [HttpGet("export/{entityType}")]
    [Authorize(Policy = AuthorizationPolicies.StudentManagement)]
    public async Task<IActionResult> Export(string entityType, [FromQuery] IReadOnlyDictionary<string, string?> filters, CancellationToken cancellationToken)
    {
        var entity = entityType.Trim().ToLowerInvariant();
        string csv = entity switch
        {
            "student" => await importExportService.ExportStudentsAsync(filters, cancellationToken),
            "staff" => await importExportService.ExportStaffAsync(filters, cancellationToken),
            _ => throw new NotSupportedException($"Entity type '{entityType}' is not supported.")
        };

        var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", $"{entity}s.csv");
    }
}
