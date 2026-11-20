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
        var isInitialCatalogueSeed = existing.Count == 0;
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

        // Persist catalogue rows before querying their generated IDs for assignments.
        await db.SaveChangesAsync(cancellationToken);

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
            var currentAssignments = await db.RolePermissions.Where(x => x.RoleId == role.Id)
                .Select(x => x.PermissionId).ToListAsync(cancellationToken);
            var codes = new HashSet<string>(StringComparer.Ordinal);
            if (role.Name == InstitutionalRoles.SystemAdministrator)
            {
                var assigned = currentAssignments.ToHashSet();
                db.RolePermissions.AddRange(permissionIds.Where(pair => !assigned.Contains(pair.Value))
                    .Select(pair => new SchoolManagement.Domain.Identity.RolePermission { RoleId = role.Id, PermissionId = pair.Value }));
                continue;
            }
            if (!isInitialCatalogueSeed || currentAssignments.Count > 0) continue;
            if (staffReadRoles.Contains(role.Name, StringComparer.Ordinal))
                codes.Add("staff.view");
            if (staffManagementRoles.Contains(role.Name, StringComparer.Ordinal))
                codes.UnionWith(["staff.create", "staff.edit", "staff.delete", "staff.manage_course_assignments", "leave.view", "leave.apply", "leave.approve"]);
            db.RolePermissions.AddRange(codes.Where(permissionIds.ContainsKey)
                .Select(code => new SchoolManagement.Domain.Identity.RolePermission { RoleId = role.Id, PermissionId = permissionIds[code] }));
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
