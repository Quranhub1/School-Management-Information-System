using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class PermissionCatalogSeeder(SchoolManagementDbContext db)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var codes = PermissionCatalog.All.Select(x => x.Code).ToHashSet(StringComparer.Ordinal);
        var existing = await db.Permissions.ToListAsync(cancellationToken);
        var byCode = existing.ToDictionary(x => x.Code, StringComparer.Ordinal);
        foreach (var definition in PermissionCatalog.All)
        {
            if (byCode.TryGetValue(definition.Code, out var permission))
            {
                permission.Name = definition.Name;
                permission.GroupCode = definition.GroupCode;
                permission.GroupName = definition.GroupName;
                continue;
            }

            db.Permissions.Add(new SchoolManagement.Domain.Identity.Permission
            {
                Code = definition.Code,
                Name = definition.Name,
                GroupCode = definition.GroupCode,
                GroupName = definition.GroupName
            });
        }

        var obsolete = existing.Where(x => !codes.Contains(x.Code)).ToList();
        if (obsolete.Count > 0)
        {
            // Retain obsolete permissions while assignments still reference them; they can be retired deliberately.
            var used = await db.RolePermissions.Select(x => x.PermissionId)
                .Union(db.UserPermissions.Select(x => x.PermissionId)).ToListAsync(cancellationToken);
            db.Permissions.RemoveRange(obsolete.Where(x => !used.Contains(x.Id)));
        }

        var systemAdministrator = await db.Roles.SingleOrDefaultAsync(x => x.Name == "SystemAdministrator", cancellationToken);
        if (systemAdministrator is not null)
        {
            var allPermissionIds = await db.Permissions.Select(x => x.Id).ToListAsync(cancellationToken);
            var assignedPermissionIds = await db.RolePermissions.Where(x => x.RoleId == systemAdministrator.Id)
                .Select(x => x.PermissionId).ToListAsync(cancellationToken);
            var assigned = assignedPermissionIds.ToHashSet();
            db.RolePermissions.AddRange(allPermissionIds.Where(id => !assigned.Contains(id))
                .Select(id => new SchoolManagement.Domain.Identity.RolePermission { RoleId = systemAdministrator.Id, PermissionId = id }));
        }

        var staffReadRoles = new[]
        {
            InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar,
            InstitutionalRoles.ResidentDirector, InstitutionalRoles.Lecturer, InstitutionalRoles.Accountant,
            InstitutionalRoles.AssistantAccountant, InstitutionalRoles.AssistantPrincipal,
            InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.HrManager, InstitutionalRoles.RecordsOfficer,
            InstitutionalRoles.AdminSecretary, InstitutionalRoles.AssistantRegistrar
        };
        var staffManagementRoles = AuthorizationPolicies.RoleSets.StaffManagement;
        var permissionIds = await db.Permissions.ToDictionaryAsync(x => x.Code, x => x.Id, cancellationToken);
        var roles = await db.Roles.ToListAsync(cancellationToken);
        foreach (var role in roles)
        {
            if (await db.RolePermissions.AnyAsync(x => x.RoleId == role.Id, cancellationToken)) continue;
            var codes = new HashSet<string>(StringComparer.Ordinal);
            if (staffReadRoles.Contains(role.Name, StringComparer.Ordinal))
                codes.Add("staff.view");
            if (staffManagementRoles.Contains(role.Name, StringComparer.Ordinal))
            {
                codes.UnionWith(["staff.create", "staff.edit", "staff.delete", "staff.manage_course_assignments", "leave.view", "leave.apply", "leave.approve"]);
            }
            if (role.Name == InstitutionalRoles.SystemAdministrator)
                codes.UnionWith(PermissionCatalog.All.Select(x => x.Code));
            db.RolePermissions.AddRange(codes.Where(permissionIds.ContainsKey)
                .Select(code => new SchoolManagement.Domain.Identity.RolePermission { RoleId = role.Id, PermissionId = permissionIds[code] }));
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
