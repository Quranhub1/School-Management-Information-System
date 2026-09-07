using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Documents;
using SchoolManagement.Infrastructure.Documents;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public sealed class DocumentsController(
    StudentDocumentService service,
    SchoolManagementDbContext db,
    IWebHostEnvironment env) : ControllerBase
{
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] UploadDocumentRequest request, CancellationToken cancellationToken)
    {
        if (request.FileSize == 0)
            return BadRequest(new { message = "File is empty." });

        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? Guid.Empty.ToString());
        try
        {
            var document = await service.UploadAsync(request, userId, cancellationToken);
            return CreatedAtAction(nameof(Download), new { id = document.Id }, document);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("student/{studentId:guid}")]
    public async Task<IActionResult> GetByStudent(Guid studentId, CancellationToken cancellationToken)
    {
        var documents = await service.GetByStudentIdAsync(studentId, cancellationToken);
        return Ok(documents);
    }

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var document = await service.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound();

        var absolutePath = Path.Combine(env.WebRootPath ?? env.ContentRootPath, document.StoredPath.Replace('/', Path.DirectorySeparatorChar));
        if (!System.IO.File.Exists(absolutePath))
            return NotFound();

        var stream = new FileStream(absolutePath, FileMode.Open, FileAccess.Read, FileShare.Read, 8192, useAsync: true);
        return File(stream, document.ContentType, document.FileName);
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ?? Guid.Empty.ToString());
        try
        {
            await service.ArchiveAsync(id, userId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var document = await service.GetByIdAsync(id, cancellationToken);
        if (document is null)
            return NotFound();

        var absolutePath = Path.Combine(env.WebRootPath ?? env.ContentRootPath, document.StoredPath.Replace('/', Path.DirectorySeparatorChar));
        if (System.IO.File.Exists(absolutePath))
            System.IO.File.Delete(absolutePath);

        db.StudentDocuments.Remove(document);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
