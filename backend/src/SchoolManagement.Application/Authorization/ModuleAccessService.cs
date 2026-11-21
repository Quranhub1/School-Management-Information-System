using System.Security.Claims;

namespace SchoolManagement.Application.Authorization;

public sealed class ModuleAccessService
{
    private const string AdmissionsManageRole = "StaffAccess.Admissions.Manage";
    private const string CurriculumCourseUnitsManageRole = "StaffAccess.Curriculum.CourseUnits.Manage";
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
            return ModuleAccess.RolesByModule.Keys.Concat(new[] { "Library", "Communication" }).OrderBy(module => module).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

        return ModuleAccess.RolesByModule
            .Where(pair => pair.Value.Any(roles.Contains) || HasScopedStaffAccess(pair.Key, roles))
            .Select(pair => pair.Key)
            .Concat(HasLibraryAccess(roles) ? new[] { "Library" } : Array.Empty<string>())
            .Concat(HasCommunicationAccess(roles) ? new[] { "Communication" } : Array.Empty<string>())
            .OrderBy(module => module)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static bool HasLibraryAccess(IReadOnlySet<string> roles) =>
        roles.Contains(LibraryManageRole) || roles.Contains(InstitutionalRoles.Librarian) ||
        roles.Contains(InstitutionalRoles.AcademicRegistrar) || roles.Contains(InstitutionalRoles.AssistantRegistrar) ||
        roles.Contains(InstitutionalRoles.AdminSecretary) || roles.Contains(InstitutionalRoles.Lecturer);

    private static bool HasCommunicationAccess(IReadOnlySet<string> roles) =>
        roles.Contains(NoticeboardManageRole) || roles.Contains(InstitutionalRoles.SystemAdministrator) ||
        roles.Contains(InstitutionalRoles.AcademicRegistrar) || roles.Contains(InstitutionalRoles.HrManager);

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
            InstitutionalModules.Academic => Has(CurriculumCourseUnitsManageRole) || Has(CurriculumManageRole) || Has(ClassesDeleteRole),
            InstitutionalModules.Curriculum => Has(CurriculumCourseUnitsManageRole) || Has(CurriculumManageRole),
            InstitutionalModules.Timetable => Has(TimetableManageRole),
            InstitutionalModules.Attendance => Has(StaffAttendanceRole),
            InstitutionalModules.Finance => HasPrefix("StaffAccess.Finance."),
            InstitutionalModules.Staff => HasPrefix("StaffAccess.Staff."),
            _ => false
        };
    }
}
