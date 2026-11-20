using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Api.Services;
using SchoolManagement.Application.Staff;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Identity;
using SchoolManagement.Domain.People;
using System.Text.Json;
using System.Security.Claims;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/staff")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class StaffController(SchoolManagementDbContext db, CampusAccessService campusAccess, LeaveRequestService leaveService, PasswordHasher passwordHasher) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> List([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is { Count: 0 }) return Forbid();
        var query = db.StaffMembers.AsNoTracking();
        if (accessibleCampuses is not null)
            query = query.Where(x => x.CampusId.HasValue && accessibleCampuses.Contains(x.CampusId.Value));
        if (activeOnly) query = query.Where(x => x.IsActive);
        var staff = await query.OrderBy(x => x.LastName).ThenBy(x => x.FirstName).ToListAsync(cancellationToken);
        return Ok(staff.Select(ToProfile));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> Get(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
        return Ok(ToProfile(staff));
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

        var campusId = await campusAccess.ResolveCampusForWriteAsync(User, request.CampusId, cancellationToken);
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is not null && !campusId.HasValue) return Forbid();
        if (request.CampusId.HasValue && !campusId.HasValue) return Forbid();

        User? loginUser = null;
        if (request.CreateLoginAccount)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 10)
                return BadRequest(new { message = "A login username and password of at least 10 characters are required when creating a staff account." });
            var username = request.Username.Trim();
            if (await db.Users.AnyAsync(x => x.Username.ToLower() == username.ToLower(), cancellationToken))
                return Conflict(new { message = "That login username is already in use." });

            var requestedRoleNames = (request.RoleNames ?? Array.Empty<string>()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var roles = await db.Roles.Where(x => requestedRoleNames.Contains(x.Name)).ToListAsync(cancellationToken);
            if (roles.Count != requestedRoleNames.Length)
                return BadRequest(new { message = "One or more selected staff roles are invalid. Refresh the role list and try again." });

            var requestedCodes = (request.PermissionCodes ?? Array.Empty<string>()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            var deniedCodes = (request.DeniedPermissionCodes ?? Array.Empty<string>()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            if (requestedCodes.Intersect(deniedCodes, StringComparer.OrdinalIgnoreCase).Any())
                return BadRequest(new { message = "A permission cannot be both granted and denied." });

            var actorIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            if (!Guid.TryParse(actorIdValue, out var actorUserId)) return Forbid();
            var actorPermissions = await GetEffectivePermissionCodesAsync(actorUserId, cancellationToken);
            if (requestedRoleNames.Contains("SystemAdministrator", StringComparer.OrdinalIgnoreCase)
                && !actorPermissions.Contains("administration.manage-users"))
                return Forbid();
            if (requestedCodes.Any(code => !actorPermissions.Contains(code)))
                return Forbid();

            // A staff manager may assign a role, but cannot pass on role defaults
            // that the manager does not personally hold.
            var roleIds = roles.Select(x => x.Id).ToArray();
            var rolePermissionCodes = await (from assignment in db.RolePermissions
                                             join permission in db.Permissions on assignment.PermissionId equals permission.Id
                                             where roleIds.Contains(assignment.RoleId)
                                             select permission.Code).Distinct().ToListAsync(cancellationToken);
            deniedCodes = deniedCodes.Concat(rolePermissionCodes.Where(code => !actorPermissions.Contains(code)))
                .Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

            var allRequestedCodes = requestedCodes.Concat(deniedCodes).ToArray();
            var permissions = await db.Permissions.Where(x => allRequestedCodes.Contains(x.Code)).ToListAsync(cancellationToken);
            if (permissions.Count != allRequestedCodes.Length)
                return BadRequest(new { message = "One or more selected permissions are invalid. Refresh the permission catalogue and try again." });

            loginUser = new User
            {
                Username = username,
                PasswordHash = passwordHasher.Hash(request.Password),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = Clean(request.Email),
                IsActive = true
            };
            db.Users.Add(loginUser);
            foreach (var role in roles)
                db.UserRoles.Add(new UserRole { UserId = loginUser.Id, RoleId = role.Id });
            foreach (var permission in permissions)
                db.UserPermissions.Add(new UserPermission
                {
                    UserId = loginUser.Id,
                    PermissionId = permission.Id,
                    IsGranted = requestedCodes.Contains(permission.Code, StringComparer.OrdinalIgnoreCase)
                });
        }

        var staff = new StaffMember
        {
            CampusId = campusId,
            UserId = loginUser?.Id,
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
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
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
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
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

    private async Task<HashSet<string>> GetEffectivePermissionCodesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var roleCodes = await (from userRole in db.UserRoles
                               join rolePermission in db.RolePermissions on userRole.RoleId equals rolePermission.RoleId
                               join permission in db.Permissions on rolePermission.PermissionId equals permission.Id
                               where userRole.UserId == userId
                               select permission.Code).Distinct().ToListAsync(cancellationToken);
        var overrides = await (from assignment in db.UserPermissions
                               join permission in db.Permissions on assignment.PermissionId equals permission.Id
                               where assignment.UserId == userId
                               select new { permission.Code, assignment.IsGranted }).ToListAsync(cancellationToken);
        var effective = roleCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var assignment in overrides)
        {
            if (assignment.IsGranted) effective.Add(assignment.Code);
            else effective.Remove(assignment.Code);
        }
        return effective;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string SerializeCourseIds(IEnumerable<Guid>? ids)
        => JsonSerializer.Serialize((ids ?? Array.Empty<Guid>()).Where(id => id != Guid.Empty).Distinct().ToArray());

    private static object ToProfile(StaffMember staff) => new
    {
        staff.Id, staff.UserId, staff.StaffNumber, staff.FirstName, staff.LastName, staff.OtherNames,
        DisplayName = PersonName.Format(staff.LastName, staff.FirstName, staff.OtherNames), staff.NationalId,
        staff.PhoneNumber, staff.Email, staff.EmploymentType, staff.StaffType, staff.IsActive,
        staff.DepartmentId, staff.JobTitle, staff.HighestQualification, staff.Speciality,
        staff.ProfessionalRegistration,
        CourseUnitIds = JsonSerializer.Deserialize<Guid[]>(staff.CourseUnitIdsJson ?? "[]") ?? Array.Empty<Guid>()
    };

    [HttpGet("{id:guid}/leave")]
    [Authorize(Policy = StaffPolicies.Read)]
    public async Task<IActionResult> GetLeave(Guid id, CancellationToken cancellationToken)
    {
        var campusId = await db.StaffMembers.Where(x => x.Id == id).Select(x => x.CampusId).SingleOrDefaultAsync(cancellationToken);
        if (!await campusAccess.CanAccessCampusAsync(User, campusId, cancellationToken)) return Forbid();
        var leaveRequests = await leaveService.GetByStaffAsync(id, cancellationToken);
        return Ok(leaveRequests.Select(x => new
        {
            x.Id,
            x.StaffMemberId,
            LeaveType = x.LeaveType.ToString(),
            x.StartDate,
            x.EndDate,
            x.Reason,
            Status = x.Status.ToString(),
            x.ApprovedBy,
            x.ApprovedAt,
            x.CreatedAt
        }));
    }

    [HttpPost("{id:guid}/leave")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> RequestLeave(Guid id, [FromBody] CreateLeaveRequestDto request, CancellationToken cancellationToken)
    {
        var staffCampusId = await db.StaffMembers.Where(x => x.Id == id).Select(x => x.CampusId).SingleOrDefaultAsync(cancellationToken);
        if (!await campusAccess.CanAccessCampusAsync(User, staffCampusId, cancellationToken)) return Forbid();
        try
        {
            var leaveRequest = await leaveService.RequestAsync(
                id, request.LeaveType, request.StartDate, request.EndDate, request.Reason, cancellationToken);
            return Created($"api/staff/{id}/leave/{leaveRequest.Id}", leaveRequest);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPatch("leave/{id:guid}/approve")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> ApproveLeave(Guid id, [FromBody] ApproveLeaveRequest request, CancellationToken cancellationToken)
    {
        var existingRequest = await leaveService.GetByIdAsync(id, cancellationToken);
        if (existingRequest is null) return NotFound();
        var staffCampusId = await db.StaffMembers
            .Where(x => x.Id == existingRequest.StaffMemberId)
            .Select(x => x.CampusId)
            .SingleOrDefaultAsync(cancellationToken);
        if (!await campusAccess.CanAccessCampusAsync(User, staffCampusId, cancellationToken)) return Forbid();

        try
        {
            var leaveRequest = await leaveService.ApproveAsync(id, request.ApprovedBy, request.Approved, cancellationToken);
            if (leaveRequest is null) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
    }

    [HttpPatch("leave/{id:guid}/cancel")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> CancelLeave(Guid id, CancellationToken cancellationToken)
    {
        var existingRequest = await leaveService.GetByIdAsync(id, cancellationToken);
        if (existingRequest is null) return NotFound();
        var staffCampusId = await db.StaffMembers
            .Where(x => x.Id == existingRequest.StaffMemberId)
            .Select(x => x.CampusId)
            .SingleOrDefaultAsync(cancellationToken);
        if (!await campusAccess.CanAccessCampusAsync(User, staffCampusId, cancellationToken)) return Forbid();

        var leaveRequest = await leaveService.CancelAsync(id, cancellationToken);
        if (leaveRequest is null) return NotFound();
        return NoContent();
    }
}

public sealed record CreateStaffRequest(string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType, StaffType StaffType = StaffType.NonTeaching, Guid? DepartmentId = null, string? JobTitle = null, string? HighestQualification = null, string? Speciality = null, string? ProfessionalRegistration = null, Guid[]? CourseUnitIds = null, Guid? CampusId = null, bool CreateLoginAccount = false, string? Username = null, string? Password = null, string[]? RoleNames = null, string[]? PermissionCodes = null, string[]? DeniedPermissionCodes = null);
public sealed record UpdateStaffRequest(Guid Id, string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType, StaffType StaffType = StaffType.NonTeaching, Guid? DepartmentId = null, string? JobTitle = null, string? HighestQualification = null, string? Speciality = null, string? ProfessionalRegistration = null, Guid[]? CourseUnitIds = null);
public sealed record UpdateStaffCourseUnitsRequest(Guid[]? CourseUnitIds);
public sealed record ApproveLeaveRequest(Guid? ApprovedBy, bool Approved);
