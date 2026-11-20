using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/permissions")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PermissionsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> MyPermissions(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue("userId");
        if (!Guid.TryParse(userIdValue, out var userId)) return Unauthorized();

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
        return Ok(new { permissions = effective.OrderBy(x => x).ToArray() });
    }

    [HttpGet("catalog")]
    [Authorize]
    public async Task<IActionResult> Catalog(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? User.FindFirstValue("userId");
        if (!Guid.TryParse(userIdValue, out var userId)) return Unauthorized();

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

        var catalog = await db.Permissions.AsNoTracking()
            .Where(x => effective.Contains(x.Code))
            .OrderBy(x => x.GroupKey).ThenBy(x => x.Name)
            .Select(x => new { x.Id, x.Code, x.Name, x.GroupKey, x.Description })
            .ToListAsync(cancellationToken);
        return Ok(catalog);
    }

    [HttpGet("roles")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Roles(CancellationToken cancellationToken)
        => Ok(await db.Roles.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                PermissionCodes = db.RolePermissions.Where(assignment => assignment.RoleId == x.Id)
                    .Join(db.Permissions, assignment => assignment.PermissionId, permission => permission.Id, (_, permission) => permission.Code)
                    .ToList()
            }).ToListAsync(cancellationToken));

    [HttpGet("users/{userId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Administration)]
    public async Task<IActionResult> GetUserPermissions(Guid userId, CancellationToken cancellationToken)
    {
        if (!await db.Users.AnyAsync(x => x.Id == userId, cancellationToken)) return NotFound();
        var roles = await (from userRole in db.UserRoles
                           join role in db.Roles on userRole.RoleId equals role.Id
                           where userRole.UserId == userId
                           select role.Name).ToListAsync(cancellationToken);
        var roleDefaults = await (from userRole in db.UserRoles
                                  join rolePermission in db.RolePermissions on userRole.RoleId equals rolePermission.RoleId
                                  join permission in db.Permissions on rolePermission.PermissionId equals permission.Id
                                  where userRole.UserId == userId
                                  select permission.Code).Distinct().ToListAsync(cancellationToken);
        var overrides = await (from assignment in db.UserPermissions
                               join permission in db.Permissions on assignment.PermissionId equals permission.Id
                               where assignment.UserId == userId
                               select new { permission.Code, assignment.IsGranted }).ToListAsync(cancellationToken);
        return Ok(new { roles, roleDefaults, overrides });
    }

    [HttpPut("users/{userId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.Administration)]
    public async Task<IActionResult> SetUserPermissions(
        Guid userId,
        [FromBody] SetUserPermissionsRequest request,
        CancellationToken cancellationToken)
    {
        if (!await db.Users.AnyAsync(x => x.Id == userId, cancellationToken)) return NotFound();
        var requested = request.Overrides ?? Array.Empty<PermissionOverrideRequest>();
        if (requested.Select(x => x.Code).Distinct(StringComparer.OrdinalIgnoreCase).Count() != requested.Length)
            return BadRequest(new { message = "Each permission may only be assigned once." });

        var codes = requested.Select(x => x.Code.Trim()).ToArray();
        var permissions = await db.Permissions.Where(x => codes.Contains(x.Code)).ToListAsync(cancellationToken);
        if (permissions.Count != codes.Length)
            return BadRequest(new { message = "One or more permission codes are invalid. Refresh the permission catalogue." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var current = await db.UserPermissions.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        db.UserPermissions.RemoveRange(current);
        foreach (var permission in permissions)
        {
            var assignment = requested.Single(x => string.Equals(x.Code, permission.Code, StringComparison.OrdinalIgnoreCase));
            db.UserPermissions.Add(new UserPermission
            {
                UserId = userId,
                PermissionId = permission.Id,
                IsGranted = assignment.IsGranted
            });
        }
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return await GetUserPermissions(userId, cancellationToken);
    }
}

public sealed record SetUserPermissionsRequest(PermissionOverrideRequest[]? Overrides);
public sealed record PermissionOverrideRequest(string Code, bool IsGranted);
