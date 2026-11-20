using System.Security.Claims;

namespace SchoolManagement.Application.Authorization;

public sealed class ModuleAccessService
{
    private const string AdmissionsManageRole = "StaffAccess.Admissions.Manage";
    private const string CurriculumManageRole = "StaffAccess.Curriculum.Manage";
    private const string ClassesDeleteRole = "StaffAccess.Classes.Delete";
    private const string TimetableManageRole = "StaffAccess.Timetable.Manage";
    private const string StaffAttendanceRole = "StaffAccess.Staff.Attendance";
    private const string LibraryManageRole = "StaffAccess.Library.Manage";
    private const string NoticeboardManageRole = "StaffAccess.Noticeboard.Manage";
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
            .Concat(HasScopedStaffAccess("Library", roles) ? new[] { "Library" } : Array.Empty<string>())
            .Concat(HasScopedStaffAccess("Communication", roles) ? new[] { "Communication" } : Array.Empty<string>())
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
            InstitutionalModules.Admissions => Has(AdmissionsManageRole),
            InstitutionalModules.Students => HasPrefix("StaffAccess.Students."),
            InstitutionalModules.Academic => Has(CurriculumManageRole) || Has(ClassesDeleteRole),
            InstitutionalModules.Curriculum => Has(CurriculumManageRole),
            InstitutionalModules.Timetable => Has(TimetableManageRole),
            InstitutionalModules.Attendance => Has(StaffAttendanceRole),
            InstitutionalModules.Finance => HasPrefix("StaffAccess.Finance."),
            InstitutionalModules.Staff => HasPrefix("StaffAccess.Staff."),
            "Library" => Has(LibraryManageRole),
            "Communication" => Has(NoticeboardManageRole),
            _ => false
        };
    }
}
