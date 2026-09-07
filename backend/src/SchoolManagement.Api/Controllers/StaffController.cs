using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Staff;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/staff")]
public sealed class StaffController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> List([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var query = db.StaffMembers.AsNoTracking();
        if (activeOnly) query = query.Where(x => x.IsActive);
        return Ok(await query.OrderBy(x => x.LastName).ThenBy(x => x.FirstName).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return staff is null ? NotFound() : Ok(staff);
    }

    [HttpPost]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Create(CreateStaffRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.StaffNumber) || string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName) || string.IsNullOrWhiteSpace(request.EmploymentType))
            return BadRequest(new { message = "Staff number, names and employment type are required." });
        if (await db.StaffMembers.AnyAsync(x => x.StaffNumber == request.StaffNumber.Trim(), cancellationToken))
            return Conflict(new { message = "A staff member with this staff number already exists." });

        var staff = new StaffMember { StaffNumber = request.StaffNumber.Trim(), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(), NationalId = request.NationalId, PhoneNumber = request.PhoneNumber, Email = request.Email, EmploymentType = request.EmploymentType.Trim() };
        db.StaffMembers.Add(staff);
        await db.SaveChangesAsync(cancellationToken);
        return Created($"api/staff/{staff.Id}", staff);
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

    [HttpPut("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Update(Guid id, UpdateStaffRequest request, CancellationToken cancellationToken)
    {
        if (id != request.Id)
            return BadRequest(new { message = "Route ID and body ID must match." });

        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();

        staff.StaffNumber = request.StaffNumber.Trim();
        staff.FirstName = request.FirstName.Trim();
        staff.LastName = request.LastName.Trim();
        staff.NationalId = request.NationalId?.Trim();
        staff.PhoneNumber = request.PhoneNumber?.Trim();
        staff.Email = request.Email?.Trim();
        staff.EmploymentType = request.EmploymentType.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return Ok(staff);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();

        db.StaffMembers.Remove(staff);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/leave")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> GetLeave(Guid id, CancellationToken cancellationToken)
    {
        var requests = await db.LeaveRequests.AsNoTracking().Where(x => x.StaffMemberId == id).OrderByDescending(x => x.StartDate).ToListAsync(cancellationToken);
        return Ok(requests);
    }

    [HttpPost("{id:guid}/leave")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> RequestLeave(Guid id, [FromBody] CreateLeaveRequestDto request, CancellationToken cancellationToken)
    {
        var leaveRequest = new LeaveRequest
        {
            StaffMemberId = id,
            LeaveType = request.LeaveType,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Reason = request.Reason,
            Status = "Pending"
        };
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

public sealed record CreateStaffRequest(string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType);
public sealed record UpdateStaffRequest(Guid Id, string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType);
public sealed record ApproveLeaveRequest(Guid ApprovedBy, bool Approved);
