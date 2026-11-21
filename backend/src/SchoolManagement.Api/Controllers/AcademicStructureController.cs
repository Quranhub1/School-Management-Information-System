using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;
using AcademicStream = SchoolManagement.Domain.Academic.Stream;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-structure")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicStructureController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("years")]
    public async Task<ActionResult<IReadOnlyList<AcademicYearResponseDto>>> GetYears(CancellationToken ct)
    {
        // Keep the dropdown continuous from 2001-2002 and always extend it
        // at least 100 years beyond the current year. This avoids a hard stop
        // at the range initially inserted by the seed migration.
        var lastYear = DateTime.UtcNow.Year + 100;
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "AcademicYears"
                ("Id", "Name", "StartDate", "EndDate", "IsCurrent", "IsActive")
            SELECT gen_random_uuid(),
                   year_value::text || '-' || (year_value + 1)::text,
                   make_date(year_value, 1, 1),
                   make_date(year_value + 1, 1, 1) - 1,
                   FALSE,
                   TRUE
            FROM generate_series(2001, {lastYear}) AS years(year_value)
            WHERE NOT EXISTS (
                SELECT 1 FROM "AcademicYears" existing
                WHERE existing."Name" = year_value::text || '-' || (year_value + 1)::text
            );
            """, ct);

        var years = await db.AcademicYears.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.StartDate)
            .ToListAsync(ct);
        return Ok(years.Select(AcademicYearResponseDto.FromDomain).ToArray());
    }

    [HttpGet("intakes")]
    public async Task<ActionResult<IReadOnlyList<IntakeResponseDto>>> GetIntakes(CancellationToken ct)
    {
        var intakes = await db.Intakes.AsNoTracking()
            .Where(x => x.IsOpen)
            .OrderBy(x => x.StartDate)
            .ToListAsync(ct);
        return Ok(intakes.Select(IntakeResponseDto.FromDomain).ToArray());
    }

    [HttpPost("years")]
    public async Task<ActionResult<AcademicYearResponseDto>> CreateYear(CreateAcademicYearRequest request, CancellationToken ct)
    {
        if (request.StartDate >= request.EndDate) return BadRequest("Start date must be before end date.");
        if (await db.AcademicYears.AnyAsync(x => x.Name == request.Name && x.IsActive, ct)) return Conflict("An academic year with this name already exists.");

        if (request.IsCurrent)
        {
            await db.AcademicYears.Where(x => x.IsCurrent).ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCurrent, false), ct);
        }

        var year = new AcademicYear { Name = request.Name.Trim(), StartDate = request.StartDate, EndDate = request.EndDate, IsCurrent = request.IsCurrent, IsActive = true };
        db.AcademicYears.Add(year);
        await db.SaveChangesAsync(ct);
        return Created($"api/academic-structure/years/{year.Id}", AcademicYearResponseDto.FromDomain(year));
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
    public async Task<ActionResult<IReadOnlyList<SemesterResponseDto>>> GetPeriods(Guid academicYearId, CancellationToken ct)
    {
        var periods = await db.Semesters.AsNoTracking().Where(x => x.AcademicYearId == academicYearId).OrderBy(x => x.Sequence).ToListAsync(ct);
        return Ok(periods.Select(SemesterResponseDto.FromDomain).ToArray());
    }

    [HttpPost("years/{academicYearId:guid}/periods")]
    public async Task<ActionResult<SemesterResponseDto>> CreatePeriod(Guid academicYearId, CreateSemesterRequest request, CancellationToken ct)
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
        return Created($"api/academic-structure/periods/{period.Id}", SemesterResponseDto.FromDomain(period));
    }

    [HttpGet("streams")]
    public async Task<ActionResult<IReadOnlyList<AcademicStreamResponseDto>>> GetStreams(CancellationToken ct)
    {
        var streams = await db.Streams.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct);
        return Ok(streams.Select(AcademicStreamResponseDto.FromDomain).ToArray());
    }

    [HttpPost("streams")]
    public async Task<ActionResult<AcademicStreamResponseDto>> CreateStream([FromBody] CreateStreamRequest request, CancellationToken ct)
    {
        if (await db.Streams.AnyAsync(x => x.Code == request.Code.Trim(), ct)) return Conflict("A stream with this code already exists.");
        var stream = new AcademicStream { Name = request.Name.Trim(), Code = request.Code.Trim().ToUpperInvariant(), ClassFormId = request.ClassFormId, IsActive = true };
        db.Streams.Add(stream);
        await db.SaveChangesAsync(ct);
        return Created($"api/academic-structure/streams/{stream.Id}", AcademicStreamResponseDto.FromDomain(stream));
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


public sealed record AcademicYearResponseDto(Guid Id, string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent, bool IsActive)
{
    public static AcademicYearResponseDto FromDomain(AcademicYear year) => new(year.Id, year.Name, year.StartDate, year.EndDate, year.IsCurrent, year.IsActive);
}

public sealed record IntakeResponseDto(Guid Id, string Name, string Code, DateOnly StartDate, bool IsOpen)
{
    public static IntakeResponseDto FromDomain(Intake intake) => new(intake.Id, intake.Name, intake.Code, intake.StartDate, intake.IsOpen);
}

public sealed record SemesterResponseDto(Guid Id, Guid AcademicYearId, string Name, int Sequence, DateOnly StartDate, DateOnly EndDate, bool IsCurrent, bool IsActive)
{
    public static SemesterResponseDto FromDomain(Semester period) => new(period.Id, period.AcademicYearId, period.Name, period.Sequence, period.StartDate, period.EndDate, period.IsCurrent, period.IsActive);
}

public sealed record AcademicStreamResponseDto(Guid Id, string Name, string Code, Guid AcademicClassId, string? ClassFormId, bool IsActive)
{
    public static AcademicStreamResponseDto FromDomain(AcademicStream stream) => new(stream.Id, stream.Name, stream.Code, stream.AcademicClassId, stream.ClassFormId, stream.IsActive);
}

public sealed record CreateStreamRequest(string Name, string Code, string? ClassFormId);
public sealed record UpdateStreamRequest(string Name, string Code, string? ClassFormId, bool IsActive);

public sealed record CreateAcademicYearRequest(string Name, DateOnly StartDate, DateOnly EndDate, bool IsCurrent = false);
public sealed record CreateSemesterRequest(string Name, int Sequence, DateOnly StartDate, DateOnly EndDate, bool IsCurrent = false);
public sealed record SetActiveRequest(bool IsActive);
