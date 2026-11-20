using Microsoft.AspNetCore.Authorization;
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
    [HttpGet("catalogue")]
    [Authorize(Policy = SchoolManagement.Application.Authorization.StaffPolicies.Management)]
    public async Task<IActionResult> Catalogue(CancellationToken cancellationToken)
    {
        var rows = await db.Permissions.AsNoTracking()
            .OrderBy(x => x.GroupName).ThenBy(x => x.Name)
            .Select(permission => new { permission.GroupCode, permission.GroupName, permission.Code, permission.Name, permission.Description })
            .ToListAsync(cancellationToken);
        var groups = rows.GroupBy(x => new { x.GroupCode, x.GroupName })
            .Select(group => new
            {
                id = group.Key.GroupCode,
                label = group.Key.GroupName,
                permissions = group.Select(permission => new
                {
                    id = permission.Code,
                    label = permission.Name,
                    permission.Description
                }).ToList()
            }).ToList();
        return Ok(groups);
    }

    [HttpGet("roles")]
    [Authorize(Policy = StaffPolicies.Management)]
    public async Task<IActionResult> Roles(CancellationToken cancellationToken)
        => Ok(await db.Roles.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.Description, x.IsSystemRole }).ToListAsync(cancellationToken));

    [HttpGet("roles/{roleId:guid}")]
    [Authorize(Roles = InstitutionalRoles.SystemAdministrator)]
    public async Task<IActionResult> GetRolePermissions(Guid roleId, CancellationToken cancellationToken)
    {
        if (!await db.Roles.AnyAsync(x => x.Id == roleId, cancellationToken)) return NotFound();
        var codes = await (from assignment in db.RolePermissions
                           join permission in db.Permissions on assignment.PermissionId equals permission.Id
                           where assignment.RoleId == roleId
                           orderby permission.Code
                           select permission.Code).ToListAsync(cancellationToken);
        return Ok(new { roleId, permissionCodes = codes });
    }

    [HttpPut("roles/{roleId:guid}")]
    [Authorize(Roles = InstitutionalRoles.SystemAdministrator)]
    public async Task<IActionResult> SetRolePermissions(Guid roleId, [FromBody] PermissionCodesRequest request, CancellationToken cancellationToken)
    {
        var targetRole = await db.Roles.SingleOrDefaultAsync(x => x.Id == roleId, cancellationToken);
        if (targetRole is null) return NotFound();
        if (targetRole.Name == InstitutionalRoles.SystemAdministrator)
            return BadRequest(new { message = "The System Administrator role is protected and always retains the complete permission catalogue." });
        var codes = (request.PermissionCodes ?? Array.Empty<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim())
            .Distinct(StringComparer.Ordinal).ToArray();
        var permissions = await db.Permissions.Where(x => codes.Contains(x.Code)).ToListAsync(cancellationToken);
        if (permissions.Count != codes.Length)
            return BadRequest(new { message = "One or more permission codes are not in the central catalogue." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var current = await db.RolePermissions.Where(x => x.RoleId == roleId).ToListAsync(cancellationToken);
        db.RolePermissions.RemoveRange(current);
        db.RolePermissions.AddRange(permissions.Select(x => new RolePermission { RoleId = roleId, PermissionId = x.Id }));
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(new { roleId, assignedCount = permissions.Count });
    }

    [HttpGet("users/{userId:guid}")]
    [Authorize(Roles = InstitutionalRoles.SystemAdministrator)]
    public async Task<IActionResult> GetUserPermissions(Guid userId, CancellationToken cancellationToken)
    {
        if (!await db.Users.AnyAsync(x => x.Id == userId, cancellationToken)) return NotFound();
        var direct = await (from grant in db.UserPermissions
                            join permission in db.Permissions on grant.PermissionId equals permission.Id
                            where grant.UserId == userId
                            orderby permission.Code
                            select permission.Code).ToListAsync(cancellationToken);
        var inherited = await (from assignment in db.UserRoles
                               join rolePermission in db.RolePermissions on assignment.RoleId equals rolePermission.RoleId
                               join permission in db.Permissions on rolePermission.PermissionId equals permission.Id
                               where assignment.UserId == userId
                               select permission.Code).Distinct().OrderBy(x => x).ToListAsync(cancellationToken);
        return Ok(new { userId, directPermissionCodes = direct, inheritedPermissionCodes = inherited, effectivePermissionCodes = direct.Union(inherited).Distinct().OrderBy(x => x) });
    }

    [HttpPut("users/{userId:guid}")]
    [Authorize(Roles = InstitutionalRoles.SystemAdministrator)]
    public async Task<IActionResult> SetUserPermissions(Guid userId, [FromBody] PermissionCodesRequest request, CancellationToken cancellationToken)
    {
        if (!await db.Users.AnyAsync(x => x.Id == userId, cancellationToken)) return NotFound();
        var codes = (request.PermissionCodes ?? Array.Empty<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim())
            .Distinct(StringComparer.Ordinal).ToArray();
        var permissions = await db.Permissions.Where(x => codes.Contains(x.Code)).ToListAsync(cancellationToken);
        if (permissions.Count != codes.Length)
            return BadRequest(new { message = "One or more permission codes are not in the central catalogue." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var current = await db.UserPermissions.Where(x => x.UserId == userId).ToListAsync(cancellationToken);
        db.UserPermissions.RemoveRange(current);
        db.UserPermissions.AddRange(permissions.Select(x => new UserPermission { UserId = userId, PermissionId = x.Id }));
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return Ok(new { userId, directPermissionCount = permissions.Count });
    }
}

public sealed record PermissionCodesRequest(string[]? PermissionCodes);
