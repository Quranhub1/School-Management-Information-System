namespace SchoolManagement.Application.Authorization;

/// <summary>
/// Least-privilege roles assigned from the staff recruitment access checklist.
/// These are additive module/action roles; they do not imply broad institutional roles.
/// </summary>
public static class StaffAccessRoles
{
    public const string StaffRead = "StaffAccess.Staff.Read";
    public const string StaffManage = "StaffAccess.Staff.Manage";
    public const string StaffLeaveRead = "StaffAccess.Staff.Leave.Read";
    public const string StaffLeaveManage = "StaffAccess.Staff.Leave.Manage";
    public const string StaffAttendance = "StaffAccess.Staff.Attendance";
    public const string StudentsRead = "StaffAccess.Students.Read";
    public const string StudentsManage = "StaffAccess.Students.Manage";
    public const string StudentsDelete = "StaffAccess.Students.Delete";
    public const string StudentsPromote = "StaffAccess.Students.Promote";
    public const string ClassesDelete = "StaffAccess.Classes.Delete";
    public const string CurriculumManage = "StaffAccess.Curriculum.Manage";
    public const string TimetableManage = "StaffAccess.Timetable.Manage";
    public const string LibraryManage = "StaffAccess.Library.Manage";
    public const string AdmissionsManage = "StaffAccess.Admissions.Manage";
    public const string FinanceReadIncome = "StaffAccess.Finance.Income.Read";
    public const string FinanceReadPayments = "StaffAccess.Finance.Payments.Read";
    public const string FinanceReadExpenses = "StaffAccess.Finance.Expenses.Read";
    public const string FinanceManageExpenses = "StaffAccess.Finance.Expenses.Manage";
    public const string FinanceDeletePayments = "StaffAccess.Finance.Payments.Delete";
    public const string FinanceDeleteInvoices = "StaffAccess.Finance.Invoices.Delete";
    public const string FinanceManageFeeTypes = "StaffAccess.Finance.FeeTypes.Manage";
    public const string NoticeboardManage = "StaffAccess.Noticeboard.Manage";
    public const string UsersManage = "StaffAccess.Users.Manage";
    public const string RolesManage = "StaffAccess.Roles.Manage";
    public const string SettingsManage = "StaffAccess.Settings.Manage";
    public const string BackupsManage = "StaffAccess.Backups.Manage";

    public static readonly IReadOnlyDictionary<string, string> ByPermission = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["staff.list"] = StaffRead,
        ["staff.leaves.read"] = StaffLeaveRead,
        ["staff.attendance"] = StaffAttendance,
        ["students.delete"] = StudentsDelete,
        ["staff.manage"] = StaffManage,
        ["curriculum.course-units.manage"] = CurriculumManage,
        ["curriculum.manage"] = CurriculumManage,
        ["library.manage"] = LibraryManage,
        ["finance.payments.delete"] = FinanceDeletePayments,
        ["finance.expenses.read"] = FinanceReadExpenses,
        ["admissions.manage"] = AdmissionsManage,
        ["users.manage"] = UsersManage,
        ["students.promote"] = StudentsPromote,
        ["students.classes.manage"] = StudentsManage,
        ["timetable.manage"] = TimetableManage,
        ["staff.leaves.manage"] = StaffLeaveManage,
        ["noticeboard.manage"] = NoticeboardManage,
        ["roles.manage"] = RolesManage,
        ["students.manage"] = StudentsManage,
        ["finance.income.read"] = FinanceReadIncome,
        ["finance.payments.read"] = FinanceReadPayments,
        ["settings.manage"] = SettingsManage,
        ["finance.invoices.delete"] = FinanceDeleteInvoices,
        ["finance.expenses.manage"] = FinanceManageExpenses,
        ["classes.delete"] = ClassesDelete,
        ["finance.fee-types.manage"] = FinanceManageFeeTypes,
        ["backups.manage"] = BackupsManage
    };

    public static readonly IReadOnlyList<string> AllRoles = ByPermission.Where(pair => !RestrictedPermissions.Contains(pair.Key)).Select(pair => pair.Value).Distinct(StringComparer.Ordinal).ToArray();
    public static readonly IReadOnlySet<string> RestrictedPermissions = new HashSet<string>(StringComparer.Ordinal)
    {
        "users.manage", "roles.manage", "settings.manage", "backups.manage"
    };

    public static string[] ResolveRoles(IEnumerable<string>? permissionCodes)
    {
        var codes = (permissionCodes ?? Array.Empty<string>()).Distinct(StringComparer.Ordinal).ToArray();
        var restricted = codes.Where(RestrictedPermissions.Contains).ToArray();
        if (restricted.Length > 0)
            throw new ArgumentException($"The following privileges are reserved for the System Administrator: {string.Join(", ", restricted)}");
        var unknown = codes.Where(code => !ByPermission.ContainsKey(code)).ToArray();
        if (unknown.Length > 0)
            throw new ArgumentException($"Unknown staff access permission(s): {string.Join(", ", unknown)}");
        return codes.Select(code => ByPermission[code]).Distinct(StringComparer.Ordinal).ToArray();
    }
}
