namespace SchoolManagement.Application.Authorization;

public static class ModuleAccess
{
    public static readonly IReadOnlyDictionary<string, string[]> RolesByModule =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [InstitutionalModules.Dashboard] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Student, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.Secretary, InstitutionalRoles.HeadOfDepartment],
            [InstitutionalModules.Admissions] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary, InstitutionalRoles.AssistantPrincipal],
            [InstitutionalModules.Students] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment],
            [InstitutionalModules.Academic] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment],
            [InstitutionalModules.Curriculum] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment],
            [InstitutionalModules.Attendance] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment],
            [InstitutionalModules.Assessment] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment],
            [InstitutionalModules.Examinations] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal],
            [InstitutionalModules.Results] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal],
            [InstitutionalModules.ClinicalPlacement] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector],
            [InstitutionalModules.Finance] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary],
            [InstitutionalModules.Staff] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal],
            [InstitutionalModules.Reports] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.Secretary],
            [InstitutionalModules.Users] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Principal],
            [InstitutionalModules.Settings] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Principal]
        };
}
