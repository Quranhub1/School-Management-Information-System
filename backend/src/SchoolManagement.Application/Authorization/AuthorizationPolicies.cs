namespace SchoolManagement.Application.Authorization;

public static class AuthorizationPolicies
{
    public const string Administration = "Administration";
    public const string AcademicManagement = "AcademicManagement";
    public const string AcademicRead = "AcademicRead";
    public const string StudentManagement = "StudentManagement";
    public const string FinanceManagement = "FinanceManagement";
    public const string FinanceRead = "FinanceRead";
    public const string PayrollRead = "PayrollRead";
    public const string FinanceOperations = "FinanceOperations";
    public const string ExaminationManagement = "ExaminationManagement";
    public const string AttendanceManagement = "AttendanceManagement";
    public const string AttendanceRead = "AttendanceRead";
    public const string HostelManagement = "HostelManagement";
    public const string InventoryManagement = "InventoryManagement";
    public const string ReportingManagement = "ReportingManagement";
    public const string CommunicationManagement = "CommunicationManagement";
    public const string CommunicationRead = "CommunicationRead";
    public const string AdmissionsRead = "AdmissionsRead";
    public const string StudentPortal = "StudentPortal";
    public const string Student360 = "Student360";
    public const string StudentRead = "StudentRead";
    public const string MedicalRecords = "MedicalRecords";

    public static class RoleSets
    {
        public static readonly string[] AcademicManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.HrManager, StaffAccessRoles.CurriculumManage, StaffAccessRoles.ClassesDelete];
        public static readonly string[] AcademicRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.AdminSecretary, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.HrManager, StaffAccessRoles.CurriculumManage, StaffAccessRoles.ClassesDelete];
        public static readonly string[] StudentManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AdminSecretary, InstitutionalRoles.HrManager, StaffAccessRoles.StudentsManage, StaffAccessRoles.StudentsDelete, StaffAccessRoles.StudentsPromote];
        public static readonly string[] StaffManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Accountant, InstitutionalRoles.HrManager, InstitutionalRoles.RecordsOfficer, StaffAccessRoles.StaffManage, StaffAccessRoles.StaffLeaveManage];
        public static readonly string[] MedicalRecords = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.MedicalOfficer];
        public static readonly string[] StudentRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.Principal, InstitutionalRoles.Director, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary, InstitutionalRoles.AdminSecretary, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.Receptionist, InstitutionalRoles.HrManager, InstitutionalRoles.RecordsOfficer, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.MedicalOfficer, StaffAccessRoles.StudentsRead, StaffAccessRoles.StudentsManage, StaffAccessRoles.StudentsDelete, StaffAccessRoles.StudentsPromote];
        public static readonly string[] FinanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Accountant, StaffAccessRoles.FinanceManageExpenses, StaffAccessRoles.FinanceManageFeeTypes, StaffAccessRoles.FinanceDeleteInvoices, StaffAccessRoles.FinanceDeletePayments];
        public static readonly string[] FinanceOperations = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Accountant, InstitutionalRoles.AssistantAccountant, StaffAccessRoles.FinanceDeleteInvoices, StaffAccessRoles.FinanceDeletePayments];
        public static readonly string[] FinanceRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Accountant, InstitutionalRoles.AssistantAccountant, InstitutionalRoles.Principal, InstitutionalRoles.Director, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary, InstitutionalRoles.HrManager, StaffAccessRoles.FinanceReadIncome, StaffAccessRoles.FinanceReadPayments, StaffAccessRoles.FinanceReadExpenses, StaffAccessRoles.FinanceManageExpenses, StaffAccessRoles.FinanceManageFeeTypes, StaffAccessRoles.FinanceDeleteInvoices, StaffAccessRoles.FinanceDeletePayments];
        public static readonly string[] PayrollRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Accountant, InstitutionalRoles.AssistantAccountant, InstitutionalRoles.HrManager];
        public static readonly string[] ExaminationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.HrManager];
        public static readonly string[] AttendanceManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Lecturer, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.HrManager, StaffAccessRoles.StaffAttendance];
        public static readonly string[] AttendanceRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.AdminSecretary, InstitutionalRoles.Lecturer, InstitutionalRoles.Principal, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.HrManager];
        public static readonly string[] HostelManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.SchoolWarden, InstitutionalRoles.ResidentDirector, InstitutionalRoles.HrManager];
        public static readonly string[] InventoryManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.RecordsOfficer, InstitutionalRoles.HrManager];
        public static readonly string[] AdmissionsManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AdminSecretary, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AdmissionsOfficer, InstitutionalRoles.HrManager, StaffAccessRoles.AdmissionsManage];
        public static readonly string[] AdmissionsRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AdmissionsOfficer, InstitutionalRoles.Principal, InstitutionalRoles.Director, InstitutionalRoles.ResidentDirector, InstitutionalRoles.Secretary, InstitutionalRoles.AdminSecretary, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.Receptionist, InstitutionalRoles.HrManager, InstitutionalRoles.RecordsOfficer, InstitutionalRoles.AssistantPrincipal];
        public static readonly string[] AdministrationManagement = [InstitutionalRoles.SystemAdministrator];
        public static readonly string[] ReportingManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.AdminSecretary, InstitutionalRoles.AdmissionsOfficer, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Principal, InstitutionalRoles.Director, InstitutionalRoles.ResidentDirector, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.Secretary, InstitutionalRoles.HrManager, InstitutionalRoles.RecordsOfficer];
        public static readonly string[] CommunicationManagement = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.HrManager, StaffAccessRoles.NoticeboardManage];
        public static readonly string[] CommunicationRead = [InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar, InstitutionalRoles.AssistantRegistrar, InstitutionalRoles.AdminSecretary, InstitutionalRoles.ExaminationsOfficer, InstitutionalRoles.Lecturer, InstitutionalRoles.RecordsOfficer, InstitutionalRoles.SchoolWarden, InstitutionalRoles.Principal, InstitutionalRoles.Director, InstitutionalRoles.Secretary, InstitutionalRoles.ResidentDirector, InstitutionalRoles.HeadOfDepartment, InstitutionalRoles.AssistantPrincipal, InstitutionalRoles.Receptionist, InstitutionalRoles.HrManager, InstitutionalRoles.Accountant, InstitutionalRoles.AssistantAccountant, InstitutionalRoles.AdmissionsOfficer, InstitutionalRoles.Librarian];
        public static readonly string[] StudentPortal = [InstitutionalRoles.Student];
        public static readonly string[] Student360 = [InstitutionalRoles.Student, InstitutionalRoles.SystemAdministrator, InstitutionalRoles.AcademicRegistrar];
    }
}
