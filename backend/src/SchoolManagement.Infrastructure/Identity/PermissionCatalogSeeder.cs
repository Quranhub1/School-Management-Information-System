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

        await db.SaveChangesAsync(cancellationToken);
    }
}
