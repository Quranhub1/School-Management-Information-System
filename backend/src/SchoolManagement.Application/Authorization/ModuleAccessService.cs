using System.Security.Claims;

namespace SchoolManagement.Application.Authorization;

public sealed class ModuleAccessService
{
    public IReadOnlyList<string> GetAccessibleModules(ClaimsPrincipal user)
    {
        var roles = user.FindAll(ClaimTypes.Role)
            .Select(claim => claim.Value)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (roles.Contains(InstitutionalRoles.SystemAdministrator))
            return ModuleAccess.RolesByModule.Keys.OrderBy(module => module).ToArray();

        return ModuleAccess.RolesByModule
            .Where(pair => pair.Value.Any(roles.Contains) || HasScopedStaffAccess(pair.Key, roles))
            .Select(pair => pair.Key)
            .Concat(HasScopedStaffAccess("Library", roles) ? ["Library"] : [])
            .Concat(HasScopedStaffAccess("Communication", roles) ? ["Communication"] : [])
            .OrderBy(module => module)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static bool HasScopedStaffAccess(string module, IReadOnlySet<string> roles)
    {
        bool Has(string role) => roles.Contains(role);
        bool HasPrefix(string prefix) => roles.Any(role => role.StartsWith(prefix, StringComparison.OrdinalIgnoreCase));
        var hasAnyStaffPermission = HasPrefix("StaffAccess.");

        return module switch
        {
            InstitutionalModules.Dashboard => hasAnyStaffPermission,
            InstitutionalModules.Admissions => Has(StaffAccessRoles.AdmissionsManage),
            InstitutionalModules.Students => HasPrefix("StaffAccess.Students."),
            InstitutionalModules.Academic => Has(StaffAccessRoles.CurriculumManage) || Has(StaffAccessRoles.ClassesDelete),
            InstitutionalModules.Curriculum => Has(StaffAccessRoles.CurriculumManage),
            InstitutionalModules.Timetable => Has(StaffAccessRoles.TimetableManage),
            InstitutionalModules.Attendance => Has(StaffAccessRoles.StaffAttendance),
            InstitutionalModules.Finance => HasPrefix("StaffAccess.Finance."),
            InstitutionalModules.Staff => HasPrefix("StaffAccess.Staff."),
            "Library" => Has(StaffAccessRoles.LibraryManage),
            "Communication" => Has(StaffAccessRoles.NoticeboardManage),
            _ => false
        };
    }
}
