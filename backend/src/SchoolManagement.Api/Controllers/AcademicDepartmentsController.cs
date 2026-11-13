using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Administration;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-departments")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicDepartmentsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("campuses")]
    public async Task<IActionResult> GetCampuses(CancellationToken ct)
    {
        var institution = await GetActiveInstitution(ct);
        if (institution is null) return Ok(Array.Empty<object>());
        return Ok(await db.Campuses.AsNoTracking().Where(x => x.InstitutionId == institution.Id && x.IsActive)
            .OrderBy(x => x.Name).Select(x => new { x.Id, x.Code, x.Name, x.IsActive }).ToListAsync(ct));
    }

    [HttpGet("faculties")]
    public async Task<IActionResult> GetFaculties([FromQuery] Guid campusId, CancellationToken ct)
    {
        if (!await IsCampusInActiveInstitution(campusId, ct)) return BadRequest(new { message = "Select a valid active campus." });
        return Ok(await db.Faculties.AsNoTracking().Where(x => x.CampusId == campusId).OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.CampusId, x.Code, x.Name, x.Description, x.IsActive }).ToListAsync(ct));
    }

    [HttpPost("faculties")]
    public async Task<IActionResult> CreateFaculty([FromBody] SaveFacultyRequest request, CancellationToken ct)
    {
        var code = request.Code?.Trim().ToUpperInvariant();
        var name = request.Name?.Trim();
        if (request.CampusId == Guid.Empty || !await IsCampusInActiveInstitution(request.CampusId, ct))
            return BadRequest(new { message = "Select a valid active campus." });
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Faculty code and name are required." });
        if (code.Length > 40 || name.Length > 160) return BadRequest(new { message = "Faculty code must be at most 40 characters and name at most 160." });
        if (await db.Faculties.AnyAsync(x => x.CampusId == request.CampusId && x.Code == code, ct))
            return Conflict(new { message = $"Faculty code '{code}' already exists on this campus." });
        var faculty = new Faculty { InstitutionId = (await GetActiveInstitution(ct))!.Id, CampusId = request.CampusId, Code = code, Name = name, Description = request.Description?.Trim() };
        db.Faculties.Add(faculty);
        await db.SaveChangesAsync(ct);
        return Created($"/api/academic-departments/faculties/{faculty.Id}", new { faculty.Id, faculty.CampusId, faculty.Code, faculty.Name, faculty.Description, faculty.IsActive });
    }

    [HttpPut("faculties/{id:guid}")]
    public async Task<IActionResult> UpdateFaculty(Guid id, [FromBody] UpdateFacultyRequest request, CancellationToken ct)
    {
        var faculty = await db.Faculties.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (faculty is null || !await IsCampusInActiveInstitution(faculty.CampusId, ct)) return NotFound(new { message = "Faculty not found." });
        if (request.CampusId != faculty.CampusId) return BadRequest(new { message = "A faculty cannot be moved between campuses. Create it under the destination campus instead." });
        var code = request.Code?.Trim().ToUpperInvariant();
        var name = request.Name?.Trim();
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Faculty code and name are required." });
        if (await db.Faculties.AnyAsync(x => x.Id != id && x.CampusId == faculty.CampusId && x.Code == code, ct))
            return Conflict(new { message = $"Faculty code '{code}' already exists on this campus." });
        faculty.Code = code; faculty.Name = name; faculty.Description = request.Description?.Trim(); faculty.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("faculties/{id:guid}/active")]
    public async Task<IActionResult> SetFacultyActive(Guid id, [FromBody] SetFacultyActiveRequest request, CancellationToken ct)
    {
        var faculty = await db.Faculties.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (faculty is null || !await IsCampusInActiveInstitution(faculty.CampusId, ct)) return NotFound(new { message = "Faculty not found." });
        faculty.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> GetDepartments([FromQuery] Guid campusId, CancellationToken ct)
    {
        if (!await IsCampusInActiveInstitution(campusId, ct)) return BadRequest(new { message = "Select a valid active campus." });
        return Ok(await db.Departments.AsNoTracking()
            .Join(db.Faculties.AsNoTracking().Where(x => x.CampusId == campusId), department => department.FacultyId, faculty => faculty.Id,
                (department, faculty) => new { department.Id, department.FacultyId, FacultyName = faculty.Name, department.Code, department.Name, department.IsActive })
            .OrderBy(x => x.FacultyName).ThenBy(x => x.Name).ToListAsync(ct));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request, CancellationToken ct)
    {
        var code = request.Code.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (request.FacultyId == Guid.Empty) return BadRequest(new { message = "Select a faculty." });
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Department code and name are required." });
        var targetFaculty = await db.Faculties.FirstOrDefaultAsync(x => x.Id == request.FacultyId && x.IsActive, ct);
        if (targetFaculty is null || !await IsCampusInActiveInstitution(targetFaculty.CampusId, ct)) return BadRequest(new { message = "The selected faculty does not exist, is inactive, or belongs to another institution." });
        if (await db.Departments.AnyAsync(x => x.Code == code && x.FacultyId == request.FacultyId, ct)) return Conflict(new { message = $"Department code '{code}' already exists in this faculty." });
        var department = new Department { FacultyId = request.FacultyId, Code = code, Name = name };
        db.Departments.Add(department); await db.SaveChangesAsync(ct);
        return Created($"/api/academic-departments/{department.Id}", department);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDepartmentRequest request, CancellationToken ct)
    {
        var department = await db.Departments.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (department is null) return NotFound(new { message = "Department not found." });
        var code = request.Code.Trim().ToUpperInvariant(); var name = request.Name.Trim();
        if (request.FacultyId == Guid.Empty) return BadRequest(new { message = "Select a faculty." });
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Department code and name are required." });
        var targetFaculty = await db.Faculties.FirstOrDefaultAsync(x => x.Id == request.FacultyId && x.IsActive, ct);
        if (targetFaculty is null || !await IsCampusInActiveInstitution(targetFaculty.CampusId, ct)) return BadRequest(new { message = "The selected faculty does not exist, is inactive, or belongs to another institution." });
        if (await db.Departments.AnyAsync(x => x.Id != id && x.FacultyId == request.FacultyId && x.Code == code, ct)) return Conflict(new { message = $"Department code '{code}' already exists in this faculty." });
        if (department.FacultyId != request.FacultyId && await db.Programmes.AnyAsync(x => x.DepartmentId == id, ct))
            return Conflict(new { message = "This department is linked to programmes. Reassign those programmes explicitly before moving the department to another faculty." });
        department.FacultyId = request.FacultyId; department.Code = code; department.Name = name; department.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct); return NoContent();
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetDepartmentActiveRequest request, CancellationToken ct)
    {
        var department = await db.Departments.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (department is null) return NotFound(new { message = "Department not found." });
        department.IsActive = request.IsActive; await db.SaveChangesAsync(ct); return NoContent();
    }

    private async Task<SchoolManagement.Domain.Academic.Institution?> GetActiveInstitution(CancellationToken ct)
    {
        var settings = await db.InstitutionSettings.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Id).FirstOrDefaultAsync(ct);
        if (settings is null) return null;
        var source = string.IsNullOrWhiteSpace(settings.Abbreviation) ? settings.InstitutionName : settings.Abbreviation;
        var code = new string(source.Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).Take(50).ToArray());
        return await db.Institutions.FirstOrDefaultAsync(x => x.Code == (string.IsNullOrWhiteSpace(code) ? "SCHOOL" : code) || x.Name == settings.InstitutionName, ct);
    }

    private async Task<bool> IsCampusInActiveInstitution(Guid? campusId, CancellationToken ct)
    {
        if (!campusId.HasValue || campusId.Value == Guid.Empty) return false;
        var institution = await GetActiveInstitution(ct);
        return institution is not null && await db.Campuses.AnyAsync(x => x.Id == campusId && x.InstitutionId == institution.Id && x.IsActive, ct);
    }
}

public sealed record SaveFacultyRequest(Guid CampusId, string Code, string Name, string? Description);
public sealed record UpdateFacultyRequest(Guid CampusId, string Code, string Name, string? Description, bool IsActive);
public sealed record SetFacultyActiveRequest(bool IsActive);
public sealed record CreateDepartmentRequest(Guid FacultyId, string Code, string Name);
public sealed record UpdateDepartmentRequest(Guid FacultyId, string Code, string Name, bool IsActive);
public sealed record SetDepartmentActiveRequest(bool IsActive);
