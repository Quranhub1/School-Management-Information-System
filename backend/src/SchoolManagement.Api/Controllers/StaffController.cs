using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Staff;
using SchoolManagement.Domain.Staff;
using System.Text.Json;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/staff")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class StaffController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> List([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var query = db.StaffMembers.AsNoTracking();
        if (activeOnly) query = query.Where(x => x.IsActive);
        var staff = await query.OrderBy(x => x.LastName).ThenBy(x => x.FirstName).ToListAsync(cancellationToken);
        return Ok(staff.Select(ToProfile));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return staff is null ? NotFound() : Ok(ToProfile(staff));
    }

    [HttpGet("course-units")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> GetCourseUnits(CancellationToken cancellationToken)
        => Ok(await db.Courses.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Code)
            .Select(x => new { x.Id, x.Code, x.Name, x.CreditUnits }).ToListAsync(cancellationToken));

    [HttpGet("departments")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> GetDepartments(CancellationToken cancellationToken)
        => Ok(await db.Departments.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Code, x.Name }).ToListAsync(cancellationToken));

    [HttpPost]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.StaffNumber) || string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName) || string.IsNullOrWhiteSpace(request.EmploymentType))
            return BadRequest(new { message = "Staff number, names and employment type are required." });
        if (await db.StaffMembers.AnyAsync(x => x.StaffNumber == request.StaffNumber.Trim(), cancellationToken))
            return Conflict(new { message = "A staff member with this staff number already exists." });

        var staff = new StaffMember
        {
            StaffNumber = request.StaffNumber.Trim(), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(),
            NationalId = request.NationalId, PhoneNumber = request.PhoneNumber, Email = request.Email,
            EmploymentType = request.EmploymentType.Trim(), StaffType = request.StaffType,
            DepartmentId = request.DepartmentId,
            JobTitle = Clean(request.JobTitle),
            HighestQualification = Clean(request.HighestQualification),
            Speciality = Clean(request.Speciality),
            ProfessionalRegistration = Clean(request.ProfessionalRegistration),
            CourseUnitIdsJson = SerializeCourseIds(request.CourseUnitIds)
        };
        db.StaffMembers.Add(staff);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/staff/{staff.Id}", ToProfile(staff));
    }

    [HttpPatch("{id:guid}/course-units")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> UpdateCourseUnits(Guid id, [FromBody] UpdateStaffCourseUnitsRequest request, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        if (staff.StaffType != StaffType.Teaching)
            return BadRequest(new { message = "Course units can only be assigned to teaching staff." });

        var courseUnitIds = (request.CourseUnitIds ?? Array.Empty<Guid>())
            .Where(courseUnitId => courseUnitId != Guid.Empty)
            .Distinct()
            .ToArray();
        var activeCourseUnitIds = await db.Courses.AsNoTracking()
            .Where(course => course.IsActive && courseUnitIds.Contains(course.Id))
            .Select(course => course.Id)
            .ToListAsync(cancellationToken);
        if (activeCourseUnitIds.Count != courseUnitIds.Length)
            return BadRequest(new { message = "One or more selected course units are unavailable or inactive. Refresh the course unit list and try again." });

        staff.CourseUnitIdsJson = SerializeCourseIds(courseUnitIds);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToProfile(staff));
    }

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        staff.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("{id:guid}/activate")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Activate(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        staff.IsActive = true;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Update(Guid id, UpdateStaffRequest request, CancellationToken cancellationToken)
    {
        if (id != request.Id) return BadRequest(new { message = "Route ID and body ID must match." });
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        staff.StaffNumber = request.StaffNumber.Trim(); staff.FirstName = request.FirstName.Trim(); staff.LastName = request.LastName.Trim();
        staff.NationalId = request.NationalId?.Trim(); staff.PhoneNumber = request.PhoneNumber?.Trim(); staff.Email = request.Email?.Trim();
        staff.EmploymentType = request.EmploymentType.Trim();
        staff.StaffType = request.StaffType;
        staff.DepartmentId = request.DepartmentId;
        staff.JobTitle = Clean(request.JobTitle);
        staff.HighestQualification = Clean(request.HighestQualification);
        staff.Speciality = Clean(request.Speciality);
        staff.ProfessionalRegistration = Clean(request.ProfessionalRegistration);
        staff.CourseUnitIdsJson = SerializeCourseIds(request.CourseUnitIds);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToProfile(staff));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        // A librarian assignment is a role link, not the staff record itself.
        // Remove that link in the same SaveChanges operation before deleting staff.
        var librarianAssignments = await db.Librarians
            .Where(x => x.StaffMemberId == id)
            .ToListAsync(cancellationToken);
        db.Librarians.RemoveRange(librarianAssignments);
        db.StaffMembers.Remove(staff);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            return Conflict(new
            {
                message = "This staff member is linked to historical or financial records that must be retained. Deactivate the staff member instead of permanently deleting them."
            });
        }
        return NoContent();
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string SerializeCourseIds(IEnumerable<Guid>? ids)
        => JsonSerializer.Serialize((ids ?? Array.Empty<Guid>()).Where(id => id != Guid.Empty).Distinct().ToArray());

    private static object ToProfile(StaffMember staff) => new
    {
        staff.Id, staff.StaffNumber, staff.FirstName, staff.LastName, staff.NationalId,
        staff.PhoneNumber, staff.Email, staff.EmploymentType, staff.StaffType, staff.IsActive,
        staff.DepartmentId, staff.JobTitle, staff.HighestQualification, staff.Speciality,
        staff.ProfessionalRegistration,
        CourseUnitIds = JsonSerializer.Deserialize<Guid[]>(staff.CourseUnitIdsJson ?? "[]") ?? Array.Empty<Guid>()
    };

    [HttpGet("{id:guid}/leave")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> GetLeave(Guid id, CancellationToken cancellationToken)
        => Ok(await db.LeaveRequests.AsNoTracking().Where(x => x.StaffMemberId == id).OrderByDescending(x => x.StartDate).ToListAsync(cancellationToken));

    [HttpPost("{id:guid}/leave")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> RequestLeave(Guid id, [FromBody] CreateLeaveRequestDto request, CancellationToken cancellationToken)
    {
        var leaveRequest = new LeaveRequest { StaffMemberId = id, LeaveType = request.LeaveType, StartDate = request.StartDate, EndDate = request.EndDate, Reason = request.Reason, Status = "Pending" };
        db.LeaveRequests.Add(leaveRequest);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/staff/{id}/leave/{leaveRequest.Id}", leaveRequest);
    }

    [HttpPatch("leave/{id:guid}/approve")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> ApproveLeave(Guid id, [FromBody] ApproveLeaveRequest request, CancellationToken cancellationToken)
    {
        var leaveRequest = await db.LeaveRequests.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (leaveRequest is null) return NotFound();
        leaveRequest.Status = request.Approved ? "Approved" : "Rejected";
        leaveRequest.ApprovedBy = request.ApprovedBy;
        leaveRequest.ApprovedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public sealed record CreateStaffRequest(string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType, StaffType StaffType = StaffType.NonTeaching, Guid? DepartmentId = null, string? JobTitle = null, string? HighestQualification = null, string? Speciality = null, string? ProfessionalRegistration = null, Guid[]? CourseUnitIds = null);
public sealed record UpdateStaffRequest(Guid Id, string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType, StaffType StaffType = StaffType.NonTeaching, Guid? DepartmentId = null, string? JobTitle = null, string? HighestQualification = null, string? Speciality = null, string? ProfessionalRegistration = null, Guid[]? CourseUnitIds = null);
public sealed record UpdateStaffCourseUnitsRequest(Guid[]? CourseUnitIds);
public sealed record ApproveLeaveRequest(Guid ApprovedBy, bool Approved);
