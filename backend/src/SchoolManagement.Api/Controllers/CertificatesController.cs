using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Certificates;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/certificates")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class CertificatesController(CertificateService service) : ControllerBase
{
    [HttpPost("generate/{studentId:guid}")]
    public async Task<IActionResult> Generate(Guid studentId, [FromBody] GenerateCertificateRequest request, CancellationToken cancellationToken)
    {
        if (request.StudentId != studentId)
            return BadRequest(new { message = "StudentId mismatch." });

        var certificate = await service.GenerateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = certificate.Id }, certificate);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var certificate = await service.GetByIdAsync(id, cancellationToken);
        return certificate is null ? NotFound() : Ok(certificate);
    }

    [HttpGet("{id:guid}/print")]
    public async Task<IActionResult> Print(Guid id, CancellationToken cancellationToken)
    {
        var certificate = await service.GetByIdAsync(id, cancellationToken);
        if (certificate is null) return NotFound();
        return Ok(new { certificate, printReady = true, issuedAt = certificate.IssuedAt.ToString("MMMM dd, yyyy"), graduationDate = certificate.GraduationDate.ToString("MMMM dd, yyyy") });
    }

    public sealed record RevokeCertificateRequest(string RevokedBy, string? Reason);

    [HttpPost("{id:guid}/revoke")]
    public async Task<IActionResult> Revoke(Guid id, [FromBody] RevokeCertificateRequest request, CancellationToken cancellationToken)
    {
        if (request is null) return BadRequest(new { message = "Request body is required." });
        await service.RevokeAsync(id, request.RevokedBy, request.Reason, cancellationToken);
        return NoContent();
    }

    [HttpGet("verify/{serialNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> Verify(string serialNumber, CancellationToken cancellationToken)
    {
        var result = await service.VerifyAsync(serialNumber, cancellationToken);
        if (result is null) return NotFound(new { message = "Certificate not found." });
        return Ok(result);
    }
}
