namespace SchoolManagement.Application.Authorization;

public static class AuthorizationPolicies
{
    public const string Administration = "Administration";
    public const string AcademicManagement = "AcademicManagement";
    public const string StudentManagement = "StudentManagement";
    public const string FinanceManagement = "FinanceManagement";
    public const string ExaminationManagement = "ExaminationManagement";
    public const string AttendanceManagement = "AttendanceManagement";
    public const string ReportingManagement = "ReportingManagement";
    public const string CommunicationManagement = "CommunicationManagement";
    public const string CommunicationRead = "CommunicationRead";

    public static class RoleSets
    {
        public static readonly string[] AcademicManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] StudentManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar];
        public static readonly string[] FinanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer];
        public static readonly string[] ExaminationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer];
        public static readonly string[] AttendanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Lecturer, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] AdmissionsManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] AdministrationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar];
        public static readonly string[] ReportingManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.Secretary];
        public static readonly string[] CommunicationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] CommunicationRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.Student, InstitutionalRoles.StoreOfficer, InstitutionalRoles.HostelWarden, InstitutionalRoles.TransportOfficer, InstitutionalRoles.Principal, InstitutionalRoles.Secretary, InstitutionalRoles.ResidentDirector, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.AssistantPrincipal];
    }
}
