namespace SchoolManagement.Application.Authorization;

public static class AuthorizationPolicies
{
    public const string Administration = "Administration";
    public const string AcademicManagement = "AcademicManagement";
    public const string StudentManagement = "StudentManagement";
    public const string FinanceManagement = "FinanceManagement";
    public const string ExaminationManagement = "ExaminationManagement";
    public const string AttendanceManagement = "AttendanceManagement";

    public static class RoleSets
    {
        public static readonly string[] AcademicManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] StudentManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar];
        public static readonly string[] FinanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer];
        public static readonly string[] ExaminationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer];
        public static readonly string[] AttendanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Lecturer, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] AdmissionsManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] AdministrationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar];
    }
}
