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

        Assert.Equal(ModuleAccess.RolesByModule.Keys.OrderBy(module => module), modules);
    }

    private static ClaimsPrincipal Principal(string role)
    {
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, "staff-test"), new Claim(ClaimTypes.Role, role)],
            authenticationType: "test");
        return new ClaimsPrincipal(identity);
    }
}
