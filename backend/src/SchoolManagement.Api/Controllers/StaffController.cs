using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Api.Services;
using SchoolManagement.Application.Staff;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.People;
using System.Text.Json;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/staff")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class StaffController(SchoolManagementDbContext db, CampusAccessService campusAccess, LeaveRequestService leaveService) : ControllerBase
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

    [HttpGet("{id:guid}/account")]
    [Authorize(Policy = StaffPolicies.AccountManagement)]
    public async Task<IActionResult> GetAccount(Guid id, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();
        var link = await db.StaffUserLinks.AsNoTracking().SingleOrDefaultAsync(x => x.StaffId == id, cancellationToken);
        if (link is null) return Ok(new { linked = false, username = (string?)null, permissions = Array.Empty<string>() });
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == link.UserId, cancellationToken);
        if (user is null) return Ok(new { linked = false, username = (string?)null, permissions = Array.Empty<string>() });
        var roleNames = await (from assignment in db.UserRoles
                               join role in db.Roles on assignment.RoleId equals role.Id
                               where assignment.UserId == user.Id
                               select role.Name).ToListAsync(cancellationToken);
        var permissions = StaffAccessRoles.ByPermission
            .Where(pair => roleNames.Contains(pair.Value, StringComparer.Ordinal))
            .Select(pair => pair.Key)
            .OrderBy(x => x)
            .ToArray();
        return Ok(new { linked = true, username = user.Username, permissions, isActive = user.IsActive });
    }

    [HttpPut("{id:guid}/account")]
    [Authorize(Policy = StaffPolicies.AccountManagement)]
    public async Task<IActionResult> SaveAccount(Guid id, [FromBody] SaveStaffAccountRequest request, CancellationToken cancellationToken)
    {
        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (staff is null) return NotFound();
        if (!await campusAccess.CanAccessCampusAsync(User, staff.CampusId, cancellationToken)) return Forbid();

        var username = request.Username?.Trim();
        var existingLink = await db.StaffUserLinks.SingleOrDefaultAsync(x => x.StaffId == id, cancellationToken);
        string[] selectedRoles;
        try { selectedRoles = request.Permissions is { Length: > 0 } ? StaffAccessRoles.ResolveRoles(request.Permissions) : Array.Empty<string>(); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        if (selectedRoles.Length == 0 && existingLink is null)
            return BadRequest(new { message = "Select at least one screen or action for this staff account." });
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest(new { message = "A username is required." });
        if (request.Password is { Length: > 0 } && request.Password.Length < 8)
            return BadRequest(new { message = "Password must contain at least 8 characters." });

        var user = existingLink is null
            ? null
            : await db.Users.SingleOrDefaultAsync(x => x.Id == existingLink.UserId, cancellationToken);
        if (existingLink is not null && user is null)
            return Conflict(new { message = "The linked login account no longer exists. Remove the stale staff account link before continuing." });
        if (user is null && string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "A password of at least 8 characters is required for a new login account." });
        if (await db.Users.AnyAsync(x => x.Username == username && (user == null || x.Id != user.Id), cancellationToken))
            return Conflict(new { message = "That username is already in use." });

        var roleEntities = await db.Roles.Where(x => selectedRoles.Contains(x.Name)).ToListAsync(cancellationToken);
        if (roleEntities.Count != selectedRoles.Length)
            return Conflict(new { message = "The staff access roles have not been seeded yet. Run the application database seeder and try again." });

        if (user is null)
        {
            user = new SchoolManagement.Domain.Identity.User
            {
                Username = username,
                PasswordHash = AuthService.HashPassword(request.Password!),
                FirstName = staff.FirstName,
                LastName = staff.LastName,
                Email = staff.Email,
                IsActive = staff.IsActive
            };
            db.Users.Add(user);
            db.StaffUserLinks.Add(new SchoolManagement.Domain.Identity.StaffUserLink { StaffId = staff.Id, UserId = user.Id });
        }
        else
        {
            user.Username = username;
            user.FirstName = staff.FirstName;
            user.LastName = staff.LastName;
            user.Email = staff.Email;
            user.IsActive = staff.IsActive;
            if (!string.IsNullOrWhiteSpace(request.Password))
                user.PasswordHash = AuthService.HashPassword(request.Password);
        }

        if (selectedRoles.Length > 0)
        {
            var currentAccessAssignments = await (
                from assignment in db.UserRoles
                join role in db.Roles on assignment.RoleId equals role.Id
                where assignment.UserId == user.Id && role.Name.StartsWith("StaffAccess.")
                select assignment).ToListAsync(cancellationToken);
            db.UserRoles.RemoveRange(currentAccessAssignments);
            foreach (var role in roleEntities)
                db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { linked = true, username = user.Username, permissions = request.Permissions, isActive = user.IsActive });
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
        if (request.BasicSalary is < 0)
            return BadRequest(new { message = "Basic salary cannot be negative." });
        if (request.PhotographDataUrl is { Length: > 2_100_000 } || (request.PhotographDataUrl is not null && !request.PhotographDataUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { message = "Staff photograph must be a supported image smaller than 1.5 MB." });
        if (await db.StaffMembers.AnyAsync(x => x.StaffNumber == request.StaffNumber.Trim(), cancellationToken))
            return Conflict(new { message = "A staff member with this staff number already exists." });

        var campusId = await campusAccess.ResolveCampusForWriteAsync(User, request.CampusId, cancellationToken);
        var accessibleCampuses = await campusAccess.GetAccessibleCampusIdsAsync(User, cancellationToken);
        if (accessibleCampuses is not null && !campusId.HasValue) return Forbid();
        if (request.CampusId.HasValue && !campusId.HasValue) return Forbid();

        var staff = new StaffMember
        {
            CampusId = campusId,
            StaffNumber = request.StaffNumber.Trim(), FirstName = request.FirstName.Trim(), LastName = request.LastName.Trim(),
            NationalId = request.NationalId, PhoneNumber = request.PhoneNumber, Email = request.Email,
            EmploymentType = request.EmploymentType.Trim(), StaffType = request.StaffType,
            DepartmentId = request.DepartmentId,
            JobTitle = Clean(request.JobTitle),
            HighestQualification = Clean(request.HighestQualification),
            Speciality = Clean(request.Speciality),
            ProfessionalRegistration = Clean(request.ProfessionalRegistration),
            CourseUnitIdsJson = SerializeCourseIds(request.CourseUnitIds),
            DateJoined = request.DateJoined,
            Gender = Clean(request.Gender),
            DateOfBirth = request.DateOfBirth,
            Address = Clean(request.Address),
            BankName = Clean(request.BankName),
            BankAccountNumber = Clean(request.BankAccountNumber),
            BankAddress = Clean(request.BankAddress),
            BasicSalary = request.BasicSalary,
            AttendanceMode = Clean(request.AttendanceMode),
            PhotographDataUrl = request.PhotographDataUrl
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
        var accountLink = await db.StaffUserLinks.SingleOrDefaultAsync(x => x.StaffId == id, cancellationToken);
        if (accountLink is not null) { var account = await db.Users.SingleOrDefaultAsync(x => x.Id == accountLink.UserId, cancellationToken); if (account is not null) account.IsActive = false; }
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
        var accountLink = await db.StaffUserLinks.SingleOrDefaultAsync(x => x.StaffId == id, cancellationToken);
        if (accountLink is not null) { var account = await db.Users.SingleOrDefaultAsync(x => x.Id == accountLink.UserId, cancellationToken); if (account is not null) account.IsActive = true; }
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
        staff.DateJoined = request.DateJoined;
        staff.Gender = Clean(request.Gender);
        staff.DateOfBirth = request.DateOfBirth;
        staff.Address = Clean(request.Address);
        staff.BankName = Clean(request.BankName);
        staff.BankAccountNumber = Clean(request.BankAccountNumber);
        staff.BankAddress = Clean(request.BankAddress);
        if (request.BasicSalary is < 0)
            return BadRequest(new { message = "Basic salary cannot be negative." });
        if (request.PhotographDataUrl is { Length: > 2_100_000 } || (request.PhotographDataUrl is not null && !request.PhotographDataUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new { message = "Staff photograph must be a supported image smaller than 1.5 MB." });
        staff.BasicSalary = request.BasicSalary;
        staff.AttendanceMode = Clean(request.AttendanceMode);
        if (request.PhotographDataUrl is not null) staff.PhotographDataUrl = request.PhotographDataUrl;
        staff.CourseUnitIdsJson = SerializeCourseIds(request.CourseUnitIds);
        var linkedAccount = await db.StaffUserLinks.SingleOrDefaultAsync(x => x.StaffId == id, cancellationToken);
        if (linkedAccount is not null)
        {
            var user = await db.Users.SingleOrDefaultAsync(x => x.Id == linkedAccount.UserId, cancellationToken);
            if (user is not null) { user.FirstName = staff.FirstName; user.LastName = staff.LastName; user.Email = staff.Email; }
        }
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
        var linkedAccount = await db.StaffUserLinks.SingleOrDefaultAsync(x => x.StaffId == id, cancellationToken);
        if (linkedAccount is not null)
        {
            var user = await db.Users.SingleOrDefaultAsync(x => x.Id == linkedAccount.UserId, cancellationToken);
            if (user is not null) user.IsActive = false;
        }
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
        staff.Id, staff.StaffNumber, staff.FirstName, staff.LastName, staff.OtherNames,
        DisplayName = PersonName.Format(staff.LastName, staff.FirstName, staff.OtherNames), staff.NationalId,
        staff.PhoneNumber, staff.Email, staff.EmploymentType, staff.StaffType, staff.IsActive,
        staff.DepartmentId, staff.JobTitle, staff.HighestQualification, staff.Speciality,
        staff.ProfessionalRegistration, staff.DateJoined, staff.Gender, staff.DateOfBirth,
        staff.Address, staff.BankName, staff.BankAccountNumber, staff.BankAddress,
        staff.BasicSalary, staff.AttendanceMode, HasPhotograph = !string.IsNullOrWhiteSpace(staff.PhotographDataUrl),
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
    [Authorize(Policy = StaffPolicies.LeaveManagement)]
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
    [Authorize(Policy = StaffPolicies.LeaveManagement)]
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
    [Authorize(Policy = StaffPolicies.LeaveManagement)]
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

public sealed record CreateStaffRequest(string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType, StaffType StaffType = StaffType.NonTeaching, Guid? DepartmentId = null, string? JobTitle = null, string? HighestQualification = null, string? Speciality = null, string? ProfessionalRegistration = null, Guid[]? CourseUnitIds = null, Guid? CampusId = null, DateOnly? DateJoined = null, string? Gender = null, DateOnly? DateOfBirth = null, string? Address = null, string? BankName = null, string? BankAccountNumber = null, string? BankAddress = null, decimal? BasicSalary = null, string? AttendanceMode = null, string? PhotographDataUrl = null);
public sealed record UpdateStaffRequest(Guid Id, string StaffNumber, string FirstName, string LastName, string? NationalId, string? PhoneNumber, string? Email, string EmploymentType, StaffType StaffType = StaffType.NonTeaching, Guid? DepartmentId = null, string? JobTitle = null, string? HighestQualification = null, string? Speciality = null, string? ProfessionalRegistration = null, Guid[]? CourseUnitIds = null, DateOnly? DateJoined = null, string? Gender = null, DateOnly? DateOfBirth = null, string? Address = null, string? BankName = null, string? BankAccountNumber = null, string? BankAddress = null, decimal? BasicSalary = null, string? AttendanceMode = null, string? PhotographDataUrl = null);
public sealed record UpdateStaffCourseUnitsRequest(Guid[]? CourseUnitIds);
public sealed record SaveStaffAccountRequest(string? Username, string? Password, string[]? Permissions);
public sealed record ApproveLeaveRequest(Guid? ApprovedBy, bool Approved);
