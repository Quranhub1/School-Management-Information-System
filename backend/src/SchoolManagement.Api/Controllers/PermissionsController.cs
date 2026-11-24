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

        var isSystemAdministrator = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.Id
            where userRole.UserId == userId && role.Name == InstitutionalRoles.SystemAdministrator
            select userRole.UserId
        ).AnyAsync(cancellationToken);
        if (isSystemAdministrator)
        {
            var allPermissionCodes = await db.Permissions.AsNoTracking()
                .Select(permission => permission.Code).ToListAsync(cancellationToken);
            return Ok(new { permissions = allPermissionCodes
                .Concat(SchoolManagement.Infrastructure.Identity.PermissionCatalog.All.Select(permission => permission.Code))
                .Concat(SchoolManagement.Application.Authorization.PermissionCatalog.All.Select(permission => permission.Code))
                .Distinct(StringComparer.OrdinalIgnoreCase).OrderBy(code => code).ToArray() });
        }

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
    [HttpGet("catalogue")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Catalog(CancellationToken cancellationToken)
    {
        // Return the grouped shape consumed by the role-permission editor.
        // Permission codes are the stable identifiers sent back by the editor.
        var permissions = await db.Permissions.AsNoTracking()
            .OrderBy(x => x.GroupKey).ThenBy(x => x.Name)
            .Select(x => new { x.Code, x.Name, x.GroupKey, x.Description })
            .ToListAsync(cancellationToken);

        var catalogue = permissions
            .GroupBy(x => x.GroupKey)
            .Select(group => new
            {
                id = group.Key,
                label = group.Key.Replace("-", " ").Replace("_", " "),
                permissions = group.Select(permission => new
                {
                    id = permission.Code,
                    label = permission.Name,
                    description = permission.Description
                }).ToArray()
            })
            .ToArray();

        return Ok(catalogue);
    }

    [HttpGet("roles")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Roles(CancellationToken cancellationToken)
        => Ok(await db.Roles.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new
            {
                id = x.Id,
                x.Name,
                x.Description,
                x.IsSystemRole
            }).ToListAsync(cancellationToken));

    [HttpGet("roles/{roleId:guid}")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> GetRolePermissionCodes(Guid roleId, CancellationToken cancellationToken)
    {
        if (!await db.Roles.AnyAsync(role => role.Id == roleId, cancellationToken))
            return NotFound();

        var permissionCodes = await db.RolePermissions
            .Where(assignment => assignment.RoleId == roleId)
            .Join(db.Permissions, assignment => assignment.PermissionId, permission => permission.Id,
                (_, permission) => permission.Code)
            .OrderBy(code => code)
            .ToListAsync(cancellationToken);

        return Ok(new { roleId, permissionCodes });
    }

    [HttpPut("roles/{roleId:guid}")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> SetRolePermissionCodes(
        Guid roleId,
        [FromBody] SetRolePermissionCodesRequest request,
        CancellationToken cancellationToken)
    {
        var role = await db.Roles.SingleOrDefaultAsync(item => item.Id == roleId, cancellationToken);
        if (role is null) return NotFound();
        if (string.Equals(role.Name, "SystemAdministrator", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "The System Administrator role is protected and cannot be edited." });

        var codes = (request.PermissionCodes ?? Array.Empty<string>())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code.Trim())
            .ToArray();
        if (codes.Distinct(StringComparer.OrdinalIgnoreCase).Count() != codes.Length)
            return BadRequest(new { message = "Each permission may only be selected once." });

        var permissions = await db.Permissions
            .Where(permission => codes.Contains(permission.Code))
            .ToListAsync(cancellationToken);
        if (permissions.Count != codes.Length)
            return BadRequest(new { message = "One or more permission codes are invalid. Refresh the permission catalogue." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var existing = await db.RolePermissions
            .Where(assignment => assignment.RoleId == roleId)
            .ToListAsync(cancellationToken);
        db.RolePermissions.RemoveRange(existing);

        foreach (var permission in permissions)
            db.RolePermissions.Add(new RolePermission { RoleId = roleId, PermissionId = permission.Id });

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new { roleId, assignedCount = permissions.Count });
    }

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
        var currentByPermission = current.ToDictionary(x => x.PermissionId);
        var desiredPermissionIds = permissions.Select(x => x.Id).ToHashSet();
        db.UserPermissions.RemoveRange(current.Where(x => !desiredPermissionIds.Contains(x.PermissionId)));
        foreach (var permission in permissions)
        {
            var assignment = requested.Single(x => string.Equals(x.Code, permission.Code, StringComparison.OrdinalIgnoreCase));
            if (currentByPermission.TryGetValue(permission.Id, out var existing))
            {
                existing.IsGranted = assignment.IsGranted;
                continue;
            }
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
public sealed record SetRolePermissionCodesRequest(string[]? PermissionCodes);
public sealed record PermissionOverrideRequest(string Code, bool IsGranted);
