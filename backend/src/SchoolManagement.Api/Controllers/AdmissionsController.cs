using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Admissions;
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
}

public sealed record CreateApplicantRequest(string FirstName, string LastName, string? OtherNames, DateOnly? DateOfBirth, string? Gender, string? NationalId, string? PhoneNumber, string? Email);
public sealed record UpdateAdmissionStatusRequest(string Status);
