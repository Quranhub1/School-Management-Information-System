using System.Security.Claims;
using SchoolManagement.Application.Authorization;

namespace SchoolManagement.Application.Tests;

public sealed class ModuleAccessServiceTests
{
    [Fact]
    public void Staff_student_permission_exposes_only_student_workspaces_and_dashboard()
    {
        var principal = Principal("StaffAccess.Students.Read");
        var modules = new ModuleAccessService().GetAccessibleModules(principal);

        Assert.Contains(InstitutionalModules.Students, modules);
        Assert.Contains(InstitutionalModules.Dashboard, modules);
        Assert.DoesNotContain(InstitutionalModules.Finance, modules);
        Assert.DoesNotContain(InstitutionalModules.Users, modules);
        Assert.DoesNotContain(InstitutionalModules.Settings, modules);
    }

    [Fact]
    public void Staff_finance_permission_exposes_finance_without_administration()
    {
        var principal = Principal("StaffAccess.Finance.Payments.Read");
        var modules = new ModuleAccessService().GetAccessibleModules(principal);

        Assert.Contains(InstitutionalModules.Finance, modules);
        Assert.Contains(InstitutionalModules.Dashboard, modules);
        Assert.DoesNotContain(InstitutionalModules.Users, modules);
        Assert.DoesNotContain(InstitutionalModules.Settings, modules);
    }

    [Fact]
    public void System_administrator_retains_every_configured_module()
    {
        var modules = new ModuleAccessService().GetAccessibleModules(Principal(InstitutionalRoles.SystemAdministrator));

        Assert.Equal(ModuleAccess.RolesByModule.Keys.Concat(new[] { "Library", "Communication" }).OrderBy(module => module).Distinct(StringComparer.OrdinalIgnoreCase), modules);
    }


    [Fact]
    public void Staff_checklist_permissions_resolve_to_independent_roles()
    {
        var roleNames = StaffAccessRoles.ByPermission.Values.ToArray();

        Assert.Equal(roleNames.Length, roleNames.Distinct(StringComparer.Ordinal).Count());
        Assert.NotEqual(
            StaffAccessRoles.ByPermission["curriculum.course-units.manage"],
            StaffAccessRoles.ByPermission["curriculum.manage"]);
        Assert.NotEqual(
            StaffAccessRoles.ByPermission["students.classes.manage"],
            StaffAccessRoles.ByPermission["students.manage"]);
    }

    [Fact]
    public void Course_unit_permission_exposes_academic_workspace_without_other_staff_modules()
    {
        var modules = new ModuleAccessService()
            .GetAccessibleModules(Principal(StaffAccessRoles.CurriculumCourseUnitsManage));

        Assert.Contains(InstitutionalModules.Academic, modules);
        Assert.Contains(InstitutionalModules.Curriculum, modules);
        Assert.DoesNotContain(InstitutionalModules.Finance, modules);
        Assert.DoesNotContain(InstitutionalModules.Users, modules);
    }

    private static ClaimsPrincipal Principal(string role)
    {
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "staff-test"), new Claim(ClaimTypes.Role, role)],
            authenticationType: "test");
        return new ClaimsPrincipal(identity);
    }
}
