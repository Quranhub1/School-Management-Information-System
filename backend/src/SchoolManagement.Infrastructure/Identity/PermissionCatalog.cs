using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed record PermissionDefinition(string GroupKey, string GroupName, string Code, string Name, string Description);

public static class PermissionCatalog
{
    public static readonly IReadOnlyList<PermissionDefinition> All = new[]
    {
        new PermissionDefinition("student-registry", "Student Registry", "students.read", "View student registry", "View active student records and profiles."),
        new PermissionDefinition("student-registry", "Student Registry", "students.create", "Register students", "Create student records."),
        new PermissionDefinition("student-registry", "Student Registry", "students.update", "Edit student records", "Update student demographic and registry details."),
        new PermissionDefinition("student-registry", "Student Registry", "students.archive", "Archive students", "Archive and restore student records."),
        new PermissionDefinition("student-registry", "Student Registry", "students.documents", "Manage student documents", "Upload, view and manage student documents."),
        new PermissionDefinition("admissions", "Admissions", "admissions.read", "View admissions", "View applicants and admission records."),
        new PermissionDefinition("admissions", "Admissions", "admissions.create", "Create applications", "Create applicant and admission records."),
        new PermissionDefinition("admissions", "Admissions", "admissions.review", "Review applications", "Review application requirements and eligibility."),
        new PermissionDefinition("admissions", "Admissions", "admissions.decide", "Make admission decisions", "Approve, reject or defer admission applications."),
        new PermissionDefinition("admissions", "Admissions", "admissions.enrol", "Complete enrolment", "Convert admitted applicants into enrolled students."),
        new PermissionDefinition("academics", "Academic Management", "academics.read", "View academic records", "View programmes, courses, semesters and academic records."),
        new PermissionDefinition("academics", "Academic Management", "academics.manage-programmes", "Manage programmes", "Create and edit programmes and academic authorities."),
        new PermissionDefinition("academics", "Academic Management", "academics.manage-courses", "Manage courses", "Create and edit courses, units and curricula."),
        new PermissionDefinition("academics", "Academic Management", "academics.manage-registration", "Manage course registration", "Register students for courses and units."),
        new PermissionDefinition("timetable", "Timetable", "timetable.read", "View timetable", "View timetable schedules and templates."),
        new PermissionDefinition("timetable", "Timetable", "timetable.generate", "Generate timetable", "Generate timetable schedules."),
        new PermissionDefinition("timetable", "Timetable", "timetable.edit", "Edit timetable", "Create, update and reschedule timetable entries."),
        new PermissionDefinition("timetable", "Timetable", "timetable.manage-templates", "Manage timetable templates", "Create and edit timetable templates."),
        new PermissionDefinition("examinations", "Examinations", "exams.read", "View examinations", "View examination schedules, marks and results."),
        new PermissionDefinition("examinations", "Examinations", "exams.create", "Create examinations", "Create and schedule examinations."),
        new PermissionDefinition("examinations", "Examinations", "exams.enter-marks", "Enter marks", "Enter and edit student assessment marks."),
        new PermissionDefinition("examinations", "Examinations", "exams.approve-results", "Approve results", "Verify and approve examination results."),
        new PermissionDefinition("examinations", "Examinations", "exams.print-results", "Print results", "Generate and print examination result documents."),
        new PermissionDefinition("attendance", "Attendance", "attendance.read", "View attendance", "View student and staff attendance."),
        new PermissionDefinition("attendance", "Attendance", "attendance.record", "Record attendance", "Record and edit attendance registers."),
        new PermissionDefinition("attendance", "Attendance", "attendance.manage-sessions", "Manage attendance sessions", "Create and manage attendance sessions."),
        new PermissionDefinition("finance", "Finance", "finance.read", "View finance", "View finance dashboards, balances and ledgers."),
        new PermissionDefinition("finance", "Finance", "finance.manage-fees", "Manage fees", "Create and edit fee structures and student charges."),
        new PermissionDefinition("finance", "Finance", "finance.record-payments", "Record payments", "Record manual and SchoolPay payments."),
        new PermissionDefinition("finance", "Finance", "finance.allocate-payments", "Allocate payments", "Allocate receipts to student invoices."),
        new PermissionDefinition("finance", "Finance", "finance.refund", "Process refunds", "Process and approve refunds and credit notes."),
        new PermissionDefinition("finance", "Finance", "finance.manage-ledger", "Manage finance ledger", "Manage journals, accounts and reconciliations."),
        new PermissionDefinition("finance", "Finance", "finance.reports", "View finance reports", "View and export financial statements and reports."),
        new PermissionDefinition("hr", "Human Resources", "hr.read-staff", "View staff records", "View staff profiles and employment records."),
        new PermissionDefinition("hr", "Human Resources", "hr.manage-staff", "Manage staff records", "Create, edit, activate and archive staff records."),
        new PermissionDefinition("hr", "Human Resources", "hr.manage-accounts", "Manage staff accounts", "Create and link staff login accounts."),
        new PermissionDefinition("hr", "Human Resources", "hr.manage-leave", "Manage leave", "Submit, review and approve staff leave."),
        new PermissionDefinition("hr", "Human Resources", "hr.read-payroll", "View payroll", "View payroll records and summaries."),
        new PermissionDefinition("hr", "Human Resources", "hr.manage-payroll", "Manage payroll", "Generate and process payroll."),
        new PermissionDefinition("hr", "Human Resources", "hr.manage-attendance", "Manage staff attendance", "Manage staff attendance and corrections."),
        new PermissionDefinition("inventory", "Inventory", "inventory.read", "View inventory", "View stock registers and inventory records."),
        new PermissionDefinition("inventory", "Inventory", "inventory.create", "Create inventory records", "Create stock and asset records."),
        new PermissionDefinition("inventory", "Inventory", "inventory.update", "Update inventory", "Edit stock, asset and register details."),
        new PermissionDefinition("inventory", "Inventory", "inventory.issue", "Issue and receive stock", "Record stock issues, receipts and adjustments."),
        new PermissionDefinition("inventory", "Inventory", "inventory.approve", "Approve inventory transactions", "Approve stock adjustments and requisitions."),
        new PermissionDefinition("library", "Library", "library.read", "View library", "View library catalogue and circulation."),
        new PermissionDefinition("library", "Library", "library.manage-books", "Manage library books", "Create and edit catalogue records."),
        new PermissionDefinition("library", "Library", "library.manage-circulation", "Manage circulation", "Issue, return and renew library items."),
        new PermissionDefinition("hostel", "Hostel and Welfare", "hostel.read", "View hostel records", "View hostel accommodation and allocations."),
        new PermissionDefinition("hostel", "Hostel and Welfare", "hostel.manage", "Manage hostel", "Manage hostels, rooms, beds and allocations."),
        new PermissionDefinition("medical", "Medical", "medical.read", "View medical records", "View authorized student medical records."),
        new PermissionDefinition("medical", "Medical", "medical.manage", "Manage medical records", "Create and update student medical records."),
        new PermissionDefinition("communications", "Communication", "communications.read", "View communications", "View announcements, notices and messages."),
        new PermissionDefinition("communications", "Communication", "communications.send", "Send communications", "Create and send institutional communications."),
        new PermissionDefinition("reports", "Reports and Analytics", "reports.read", "View reports", "View dashboards and institutional reports."),
        new PermissionDefinition("reports", "Reports and Analytics", "reports.export", "Export reports", "Export reports and analytics."),
        new PermissionDefinition("archives", "Archives", "archives.read", "View archives", "View archived institutional records."),
        new PermissionDefinition("archives", "Archives", "archives.manage", "Manage archives", "Archive, restore and manage archived records."),
        new PermissionDefinition("settings", "System Settings", "settings.read", "View settings", "View institutional and system settings."),
        new PermissionDefinition("settings", "System Settings", "settings.manage", "Manage settings", "Update institutional and system settings."),
        new PermissionDefinition("audit", "Audit Log", "audit.read", "View audit log", "View system audit history."),
        new PermissionDefinition("audit", "Audit Log", "audit.export", "Export audit log", "Export audit records."),
        new PermissionDefinition("administration", "Administration", "administration.read-users", "View user accounts", "View system user accounts and roles."),
        new PermissionDefinition("administration", "Administration", "administration.manage-users", "Manage user accounts", "Create, edit, activate and deactivate user accounts."),
        new PermissionDefinition("administration", "Administration", "administration.manage-roles", "Manage roles and permissions", "Manage role defaults and individual permission assignments."),
        new PermissionDefinition("administration", "Administration", "administration.backup", "Manage backups", "Create and restore database backups.")
    };

    public static async Task SeedAsync(SchoolManagementDbContext db, CancellationToken cancellationToken = default)
    {
        var existing = await db.Permissions.ToDictionaryAsync(x => x.Code, cancellationToken);
        foreach (var definition in All)
        {
            if (existing.ContainsKey(definition.Code)) continue;
            db.Permissions.Add(new Permission
            {
                Code = definition.Code,
                Name = definition.Name,
                GroupKey = definition.GroupKey,
                Description = definition.Description
            });
        }
        await db.SaveChangesAsync(cancellationToken);

        var permissions = await db.Permissions.ToDictionaryAsync(x => x.Code, cancellationToken);
        var roles = await db.Roles.ToDictionaryAsync(x => x.Name, cancellationToken);
        var adminRole = roles.GetValueOrDefault("SystemAdministrator");
        if (adminRole is not null)
        {
            var assigned = await db.RolePermissions.Where(x => x.RoleId == adminRole.Id).Select(x => x.PermissionId).ToListAsync(cancellationToken);
            var assignedIds = assigned.ToHashSet();
            foreach (var permission in permissions.Values.Where(x => !assignedIds.Contains(x.Id)))
                db.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = permission.Id });
        }
        var roleDefaults = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["AcademicRegistrar"] = ["hr.read-staff", "students.read", "students.create", "students.update", "admissions.read", "admissions.review", "admissions.enrol", "academics.read", "academics.manage-programmes", "academics.manage-courses", "academics.manage-registration", "timetable.read", "timetable.generate", "timetable.edit", "timetable.manage-templates", "exams.read", "attendance.read"],
            ["AssistantRegistrar"] = ["hr.read-staff", "students.read", "students.create", "students.update", "admissions.read", "admissions.create", "academics.read", "timetable.read", "exams.read", "attendance.read"],
            ["AdmissionsOfficer"] = ["students.read", "students.create", "admissions.read", "admissions.create", "admissions.review"],
            ["Lecturer"] = ["hr.read-staff", "students.read", "academics.read", "timetable.read", "exams.read", "exams.enter-marks", "attendance.read", "attendance.record"],
            ["ExaminationsOfficer"] = ["exams.read", "exams.create", "exams.enter-marks", "exams.approve-results", "exams.print-results", "attendance.read"],
            ["Accountant"] = ["hr.read-staff", "hr.manage-staff", "hr.read-payroll", "finance.read", "finance.manage-fees", "finance.record-payments", "finance.allocate-payments", "finance.refund", "finance.manage-ledger", "finance.reports"],
            ["AssistantAccountant"] = ["hr.read-staff", "hr.read-payroll", "finance.read", "finance.record-payments", "finance.allocate-payments", "finance.reports"],
            ["HrManager"] = ["hr.read-staff", "hr.manage-staff", "hr.manage-accounts", "hr.manage-leave", "hr.read-payroll", "hr.manage-payroll", "hr.manage-attendance", "timetable.read", "timetable.generate", "timetable.edit", "timetable.manage-templates"],
            ["ResidentDirector"] = ["hr.read-staff", "hr.manage-staff", "hr.manage-leave", "hr.read-payroll", "hostel.read", "hostel.manage", "inventory.read"],
            ["RecordsOfficer"] = ["hr.read-staff", "hr.manage-staff", "students.read", "students.documents", "archives.read", "archives.manage", "audit.read"],
            ["AdminSecretary"] = ["hr.read-staff", "students.read", "students.create", "students.update", "admissions.read"],
            ["AssistantPrincipal"] = ["hr.read-staff", "students.read", "academics.read", "timetable.read", "exams.read", "attendance.read", "reports.read"],
            ["HeadOfDepartment"] = ["hr.read-staff", "academics.read", "timetable.read", "exams.read", "attendance.read", "reports.read"],
            ["Principal"] = ["hr.read-staff", "students.read", "academics.read", "timetable.read", "exams.read", "attendance.read", "finance.read", "reports.read", "reports.export"],
            ["Director"] = ["hr.read-staff", "students.read", "academics.read", "finance.read", "reports.read", "reports.export"],
            ["Secretary"] = ["communications.read", "communications.send", "reports.read"],
            ["Receptionist"] = ["students.read", "admissions.read", "communications.read"],
            ["Librarian"] = ["library.read", "library.manage-books", "library.manage-circulation"],
            ["SchoolWarden"] = ["hostel.read", "hostel.manage", "inventory.read", "inventory.issue"],
            ["MedicalOfficer"] = ["medical.read", "medical.manage", "students.read"]
        };

        foreach (var (roleName, codes) in roleDefaults)
        {
            if (!roles.TryGetValue(roleName, out var role)) continue;
            var assignedIds = await db.RolePermissions.Where(x => x.RoleId == role.Id).Select(x => x.PermissionId).ToListAsync(cancellationToken);
            var assigned = assignedIds.ToHashSet();
            foreach (var code in codes)
            {
                if (!permissions.TryGetValue(code, out var permission) || assigned.Contains(permission.Id)) continue;
                db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
            }
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
