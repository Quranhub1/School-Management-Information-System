using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-structure")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicStructureController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("years")]
    public async Task<ActionResult<IReadOnlyList<AcademicYear>>> GetYears(CancellationToken ct)
        => Ok(await db.AcademicYears.AsNoTracking().OrderByDescending(x => x.StartDate).ToListAsync(ct));

    [HttpPost("years")]
    public async Task<ActionResult<AcademicYear>> CreateYear(CreateAcademicYearRequest request, CancellationToken ct)
    {
        if (request.StartDate >= request.EndDate) return BadRequest("Start date must be before end date.");
        if (await db.AcademicYears.AnyAsync(x => x.Name == request.Name, ct)) return Conflict("An academic year with this name already exists.");

        if (request.IsCurrent)
        {
            await db.AcademicYears.Where(x => x.IsCurrent).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);
        }

        var year = new AcademicYear { Name = request.Name.Trim(), StartDate = request.StartDate, EndDate = request.EndDate, IsCurrent = request.IsCurrent, IsActive = true };
        db.AcademicYears.Add(year);
        await db.SaveChangesAsync(ct);
        return Created($"api/academic-structure/years/{year.Id}", year);
    }

    [HttpPut("years/{id:guid}/current")]
    public async Task<IActionResult> SetCurrentYear(Guid id, CancellationToken ct)
    {
        var year = await db.AcademicYears.FindAsync([id], ct);
        if (year is null) return NotFound();
        await db.AcademicYears.Where(x => x.IsCurrent).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);
        year.IsCurrent = true;
        year.IsActive = true;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("years/{id:guid}/active")]
    public async Task<IActionResult> SetYearActive(Guid id, SetActiveRequest request, CancellationToken ct)
    {
        var year = await db.AcademicYears.FindAsync([id], ct);
        if (year is null) return NotFound();
        year.IsActive = request.IsActive;
        if (!request.IsActive) year.IsCurrent = false;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("years/{academicYearId:guid}/periods")]
    public async Task<ActionResult<IReadOnlyList<Semester>>> GetPeriods(Guid academicYearId, CancellationToken ct)
        => Ok(await db.Semesters.AsNoTracking().Where(x => x.AcademicYearId == academicYearId).OrderBy(x => x.Sequence).ToListAsync(ct));

    [HttpPost("years/{academicYearId:guid}/periods")]
    public async Task<ActionResult<Semester>> CreatePeriod(Guid academicYearId, CreateSemesterRequest request, CancellationToken ct)
    {
        var year = await db.AcademicYears.FindAsync([academicYearId], ct);
        if (year is null) return NotFound("Academic year not found.");
        if (request.StartDate >= request.EndDate) return BadRequest("Start date must be before end date.");
        if (request.StartDate < year.StartDate || request.EndDate > year.EndDate) return BadRequest("Period dates must fall within the academic year.");
        if (await db.Semesters.AnyAsync(x => x.AcademicYearId == academicYearId && (x.Name == request.Name || x.Sequence == request.Sequence), ct)) return Conflict("A period with this name or sequence already exists for this academic year.");
        if (await db.Semesters.AnyAsync(x => x.AcademicYearId == academicYearId && x.StartDate < request.EndDate && request.StartDate < x.EndDate, ct)) return Conflict("Period dates overlap an existing period.");

        if (request.IsCurrent)
            await db.Semesters.Where(x => x.AcademicYearId == academicYearId && x.IsCurrent).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);

        var period = new Semester { AcademicYearId = academicYearId, Name = request.Name.Trim(), Sequence = request.Sequence, StartDate = request.StartDate, EndDate = request.EndDate, IsCurrent = request.IsCurrent, IsActive = true };
        db.Semesters.Add(period);
        await db.SaveChangesAsync(ct);
        return Created($"api/academic-structure/periods/{period.Id}", period);
    }

    [HttpGet("streams")]
    public async Task<ActionResult<IReadOnlyList<Stream>>> GetStreams(CancellationToken ct)
        => Ok(await db.Streams.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct));

    [HttpPost("streams")]
    public async Task<ActionResult<Stream>> CreateStream([FromBody] CreateStreamRequest request, CancellationToken ct)
    {
        if (await db.Streams.AnyAsync(x => x.Code == request.Code.Trim(), ct)) return Conflict("A stream with this code already exists.");
        var stream = new Stream { Name = request.Name.Trim(), Code = request.Code.Trim().ToUpperInvariant(), ClassFormId = request.ClassFormId, IsActive = true };
        db.Streams.Add(stream);
        await db.SaveChangesAsync(ct);
        return Created($"api/academic-structure/streams/{stream.Id}", stream);
    }

    [HttpPatch("streams/{id:guid}")]
    public async Task<IActionResult> UpdateStream(Guid id, [FromBody] UpdateStreamRequest request, CancellationToken ct)
    {
        var stream = await db.Streams.FindAsync([id], ct);
        if (stream is null) return NotFound();
        stream.Name = request.Name.Trim();
        stream.Code = request.Code.Trim().ToUpperInvariant();
        stream.ClassFormId = request.ClassFormId;
        stream.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public sealed record CreateStreamRequest(string Name, string Code, string? ClassFormId);
public sealed record UpdateStreamRequest(string Name, string Code, string? ClassFormId, bool IsActive);

public sealed record CreateAcademicYearRequest(string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent = false);
public sealed record CreateSemesterRequest(string Name, int Sequence, DateOnly StartDate, DateOnly EndDate, bool IsCurrent = false);
public sealed record SetActiveRequest(bool IsActive);
