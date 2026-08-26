using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/alumni")]
[Authorize(Policy = AuthorizationPolicies.StudentManagement)]
public sealed class AlumniController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var query = db.Alumni.AsNoTracking().Where(x => x.IsActive);
        return Ok(await query.OrderByDescending(x => x.GraduationDate).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var alumni = await db.Alumni.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return alumni is null ? NotFound() : Ok(alumni);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAlumniRequest request, CancellationToken cancellationToken)
    {
        if (!await db.Students.AnyAsync(x => x.Id == request.StudentId, cancellationToken))
            return BadRequest(new { message = "Student not found." });
        if (await db.Alumni.AnyAsync(x => x.StudentId == request.StudentId, cancellationToken))
            return Conflict(new { message = "Alumni record already exists for this student." });

        var alumni = new Domain.Students.Alumni
        {
            StudentId = request.StudentId,
            GraduationDate = request.GraduationDate,
            Programme = request.Programme,
            IsActive = true
        };
        db.Alumni.Add(alumni);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/alumni/{alumni.Id}", alumni);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAlumniRequest request, CancellationToken cancellationToken)
    {
        var alumni = await db.Alumni.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (alumni is null) return NotFound();
        alumni.CurrentOccupation = request.CurrentOccupation;
        alumni.Employer = request.Employer;
        alumni.ContactInfo = request.ContactInfo;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record CreateAlumniRequest(Guid StudentId, DateOnly GraduationDate, string Programme);
public sealed record UpdateAlumniRequest(string? CurrentOccupation, string? Employer, string? ContactInfo);
