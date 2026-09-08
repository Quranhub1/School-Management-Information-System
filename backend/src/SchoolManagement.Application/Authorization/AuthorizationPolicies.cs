namespace SchoolManagement.Application.Authorization;

public static class AuthorizationPolicies
{
    public const string Administration = "Administration";
    public const string AcademicManagement = "AcademicManagement";
    public const string StudentManagement = "StudentManagement";
    public const string FinanceManagement = "FinanceManagement";
    public const string FinanceRead = "FinanceRead";
    public const string ExaminationManagement = "ExaminationManagement";
    public const string AttendanceManagement = "AttendanceManagement";
    public const string HostelManagement = "HostelManagement";
    public const string TransportManagement = "TransportManagement";
    public const string ReportingManagement = "ReportingManagement";
    public const string CommunicationManagement = "CommunicationManagement";
    public const string CommunicationRead = "CommunicationRead";
    public const string StudentPortal = "StudentPortal";
    public const string ParentPortal = "ParentPortal";
    public const string Student360 = "Student360";

    public static class RoleSets
    {
        public static readonly string[] AcademicManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] StudentManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar];
        public static readonly string[] FinanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer];
        public static readonly string[] FinanceRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.Principal, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary];
        public static readonly string[] ExaminationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer];
        public static readonly string[] AttendanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Lecturer, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] HostelManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.HostelWarden, InstitutionalRoles.Registrar, InstitutionalRoles.ResidentDirector];
        public static readonly string[] TransportManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.TransportOfficer, InstitutionalRoles.Registrar, InstitutionalRoles.ResidentDirector];
        public static readonly string[] AdmissionsManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] AdministrationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar];
        public static readonly string[] ReportingManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Principal, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.Secretary];
        public static readonly string[] CommunicationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
        public static readonly string[] CommunicationRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.FinanceOfficer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.Student, InstitutionalRoles.StoreOfficer, InstitutionalRoles.HostelWarden, InstitutionalRoles.TransportOfficer, InstitutionalRoles.Principal, InstitutionalRoles.Secretary, InstitutionalRoles.ResidentDirector, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.AssistantPrincipal];
        public static readonly string[] StudentPortal = [InstitutionalRoles.Student];
        public static readonly string[] ParentPortal = [InstitutionalRoles.Parent];
        public static readonly string[] Student360 = [InstitutionalRoles.Student, InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar];
    }
}
