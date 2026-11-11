using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/academic-departments")]
[Authorize(Policy = AuthorizationPolicies.AcademicManagement)]
public sealed class AcademicDepartmentsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("faculties")]
    public async Task<IActionResult> GetFaculties(CancellationToken ct) =>
        Ok(await db.Faculties.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Code, x.Name, x.IsActive }).ToListAsync(ct));

    [HttpGet]
    public async Task<IActionResult> GetDepartments(CancellationToken ct) =>
        Ok(await db.Departments.AsNoTracking()
            .Join(db.Faculties.AsNoTracking(), department => department.FacultyId, faculty => faculty.Id,
                (department, faculty) => new { department.Id, department.FacultyId, FacultyName = faculty.Name, department.Code, department.Name, department.IsActive })
            .OrderBy(x => x.FacultyName).ThenBy(x => x.Name).ToListAsync(ct));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request, CancellationToken ct)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var name = request.Name.Trim();
        if (request.FacultyId == Guid.Empty) return BadRequest(new { message = "Select a faculty." });
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Department code and name are required." });
        if (!await db.Faculties.AnyAsync(x => x.Id == request.FacultyId && x.IsActive, ct)) return BadRequest(new { message = "The selected faculty does not exist or is inactive." });
        if (await db.Departments.AnyAsync(x => x.Code == code, ct)) return Conflict(new { message = $"Department code '{code}' already exists." });
        var department = new Department { FacultyId = request.FacultyId, Code = code, Name = name };
        db.Departments.Add(department);
        await db.SaveChangesAsync(ct);
        return Created($"/api/academic-departments/{department.Id}", department);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDepartmentRequest request, CancellationToken ct)
    {
        var department = await db.Departments.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (department is null) return NotFound(new { message = "Department not found." });
        var code = request.Code.Trim().ToUpperInvariant();
        var name = request.Name.Trim();
        if (request.FacultyId == Guid.Empty) return BadRequest(new { message = "Select a faculty." });
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name)) return BadRequest(new { message = "Department code and name are required." });
        if (!await db.Faculties.AnyAsync(x => x.Id == request.FacultyId && x.IsActive, ct)) return BadRequest(new { message = "The selected faculty does not exist or is inactive." });
        if (await db.Departments.AnyAsync(x => x.Id != id && x.Code == code, ct)) return Conflict(new { message = $"Department code '{code}' already exists." });
        if (department.FacultyId != request.FacultyId &&
            await db.Programmes.AnyAsync(x => x.DepartmentId == id, ct))
            return Conflict(new { message = "This department is linked to programmes. Reassign those programmes explicitly before moving the department to another faculty." });
        department.FacultyId = request.FacultyId;
        department.Code = code;
        department.Name = name;
        department.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetDepartmentActiveRequest request, CancellationToken ct)
    {
        var department = await db.Departments.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (department is null) return NotFound(new { message = "Department not found." });
        department.IsActive = request.IsActive;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

public sealed record CreateDepartmentRequest(Guid FacultyId, string Code, string Name);
public sealed record UpdateDepartmentRequest(Guid FacultyId, string Code, string Name, bool IsActive);
public sealed record SetDepartmentActiveRequest(bool IsActive);
