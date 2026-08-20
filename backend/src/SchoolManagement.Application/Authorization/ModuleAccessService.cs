using System.Security.Claims;

namespace SchoolManagement.Application.Authorization;

public sealed class ModuleAccessService
{
    public IReadOnlyList<string> GetAccessibleModules(ClaimsPrincipal user)
    {
        var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
        if (roles.Contains(InstitutionalRoles.SystemAdministrator))
            return ModuleAccess.RolesByModule.Keys.OrderBy(x => x).ToArray();

        return ModuleAccess.RolesByModule
            .Where(pair => pair.Value.Any(roles.Contains))
            .Select(pair => pair.Key)
            .OrderBy(x => x)
            .ToArray();
    }
}
