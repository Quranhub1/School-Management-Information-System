using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Authorization;

public sealed record PermissionRequirement(string PermissionCode) : IAuthorizationRequirement;

/// <summary>
/// Resolves permissions from the database on each authorization decision so
/// individual revocations take effect without waiting for a JWT to expire.
/// Explicit user overrides take precedence over all role defaults.
/// </summary>
public sealed class PermissionAuthorizationHandler(SchoolManagementDbContext db)
    : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? context.User.FindFirstValue("sub")
            ?? context.User.FindFirstValue("userId");
        if (!Guid.TryParse(userIdValue, out var userId)) return;

        // System Administrator is the institution-wide superuser. This check is deliberately
        // performed before permission lookup and user overrides so every policy (including
        // newly introduced permission codes) grants access to this role.
        var isSystemAdministrator = await (
            from userRole in db.UserRoles
            join role in db.Roles on userRole.RoleId equals role.Id
            where userRole.UserId == userId && role.Name == "SystemAdministrator"
            select userRole.UserId
        ).AnyAsync();
        if (isSystemAdministrator)
        {
            context.Succeed(requirement);
            return;
        }

        var permission = await db.Permissions.AsNoTracking()
            .Where(x => x.Code == requirement.PermissionCode)
            .Select(x => new { x.Id })
            .SingleOrDefaultAsync();
        if (permission is null) return;

        var explicitOverride = await db.UserPermissions.AsNoTracking()
            .Where(x => x.UserId == userId && x.PermissionId == permission.Id)
            .Select(x => (bool?)x.IsGranted)
            .SingleOrDefaultAsync();
        if (explicitOverride.HasValue)
        {
            if (explicitOverride.Value) context.Succeed(requirement);
            return;
        }

        var hasRoleDefault = await (
            from userRole in db.UserRoles
            join rolePermission in db.RolePermissions on userRole.RoleId equals rolePermission.RoleId
            where userRole.UserId == userId && rolePermission.PermissionId == permission.Id
            select userRole.UserId
        ).AnyAsync();
        if (hasRoleDefault) context.Succeed(requirement);
    }
}
