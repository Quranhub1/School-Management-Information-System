namespace SchoolManagement.Application.Authorization;

public static class ModuleAccess
{
    public static readonly IReadOnlyDictionary<string, string[]> RolesByModule =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [InstitutionalModules.Dashboard] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Student],
            [InstitutionalModules.Admissions] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar],
            [InstitutionalModules.Students] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar],
            [InstitutionalModules.Academic] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer],
            [InstitutionalModules.Curriculum] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer],
            [InstitutionalModules.Attendance] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer],
            [InstitutionalModules.Assessment] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer],
            [InstitutionalModules.Examinations] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer],
            [InstitutionalModules.Results] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer],
            [InstitutionalModules.ClinicalPlacement] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Lecturer],
            [InstitutionalModules.Finance] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer],
            [InstitutionalModules.Staff] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar],
            [InstitutionalModules.Reports] = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.ExaminationsOfficer],
            [InstitutionalModules.Users] = [InstitutionalRoles.SystemAdministrator],
            [InstitutionalModules.Settings] = [InstitutionalRoles.SystemAdministrator]
        };
}
