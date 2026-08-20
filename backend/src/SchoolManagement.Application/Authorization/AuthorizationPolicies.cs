using Microsoft.AspNetCore.Authorization;

namespace SchoolManagement.Application.Authorization;

public static class AuthorizationPolicies
{
    public const string AcademicManagement = "AcademicManagement";
    public const string FinanceManagement = "FinanceManagement";
    public const string ExaminationManagement = "ExaminationManagement";

    public static void AddInstitutionalPolicies(AuthorizationOptions options)
    {
        options.AddPolicy(AcademicManagement, policy =>
            policy.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.Registrar, InstitutionalRoles.AcademicRegistrar));

        options.AddPolicy(FinanceManagement, policy =>
            policy.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.FinanceOfficer));

        options.AddPolicy(ExaminationManagement, policy =>
            policy.RequireRole(InstitutionalRoles.SystemAdministrator, InstitutionalRoles.ExaminationsOfficer));
    }
}
