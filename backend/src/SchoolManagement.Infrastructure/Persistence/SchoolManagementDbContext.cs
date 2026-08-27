using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Audit;
using SchoolManagement.Domain.Access;
using SchoolManagement.Domain.Calendar;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.Library;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Attendance;
using SchoolManagement.Infrastructure.Assessment;
using SchoolManagement.Infrastructure.Admissions;
using AssessmentTranscriptEntry = SchoolManagement.Domain.Assessment.TranscriptEntry;
using AssessmentAcademicResultSummary = SchoolManagement.Domain.Assessment.AcademicResultSummary;
using AdmissionEntity = SchoolManagement.Domain.Admissions.Admission;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContext(DbContextOptions<SchoolManagementDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Applicant> Applicants => Set<Applicant>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentGuardian> StudentGuardians => Set<StudentGuardian>();
    public DbSet<Faculty> Faculties => Set<Faculty>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Programme> Programmes => Set<Programme>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<Intake> Intakes => Set<Intake>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Curriculum> Curricula => Set<Curriculum>();
    public DbSet<CurriculumCourse> CurriculumCourses => Set<CurriculumCourse>();
    public DbSet<AdmissionEntity> Admissions => Set<AdmissionEntity>();
    public DbSet<AdmissionDecision> AdmissionDecisions => Set<AdmissionDecision>();
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
    public DbSet<CourseRegistration> CourseRegistrations => Set<CourseRegistration>();
    public DbSet<CourseOffering> CourseOfferings => Set<CourseOffering>();
    public DbSet<TeachingGroup> TeachingGroups => Set<TeachingGroup>();
    public DbSet<TimetableEntry> TimetableEntries => Set<TimetableEntry>();
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<StudentAttendance> StudentAttendances => Set<StudentAttendance>();
    public DbSet<StudentAcademicStatus> StudentAcademicStatuses => Set<StudentAcademicStatus>();
    public DbSet<LearningOutcome> LearningOutcomes => Set<LearningOutcome>();
    public DbSet<AssessmentPlan> AssessmentPlans => Set<AssessmentPlan>();
    public DbSet<StudentAssessment> StudentAssessments => Set<StudentAssessment>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<AssessmentTranscriptEntry> TranscriptEntries => Set<AssessmentTranscriptEntry>();
    public DbSet<AssessmentAcademicResultSummary> AcademicResultSummaries => Set<AssessmentAcademicResultSummary>();
    public DbSet<Placement> Placements => Set<Placement>();
    public DbSet<StudentPlacement> StudentPlacements => Set<StudentPlacement>();
    public DbSet<Result> Results => Set<Result>();
    public DbSet<StudentPromotion> StudentPromotions => Set<StudentPromotion>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<FeeItem> FeeItems => Set<FeeItem>();
    public DbSet<StudentInvoice> StudentInvoices => Set<StudentInvoice>();
    public DbSet<StudentFee> StudentFees => Set<StudentFee>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ChartOfAccounts> ChartOfAccounts => Set<ChartOfAccounts>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<JournalEntryLine> JournalEntryLines => Set<JournalEntryLine>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<BillPayment> BillPayments => Set<BillPayment>();
    public DbSet<Budget> Budgets => Set<Budget>();
    public DbSet<BudgetLine> BudgetLines => Set<BudgetLine>();
    public DbSet<BankReconciliation> BankReconciliations => Set<BankReconciliation>();
    public DbSet<BankStatementLine> BankStatementLines => Set<BankStatementLine>();
    public DbSet<CreditNote> CreditNotes => Set<CreditNote>();
    public DbSet<Sponsorship> Sponsorships => Set<Sponsorship>();
    public DbSet<InstalmentPlan> InstalmentPlans => Set<InstalmentPlan>();
    public DbSet<InstalmentPayment> InstalmentPayments => Set<InstalmentPayment>();
    public DbSet<MobileMoneyTransaction> MobileMoneyTransactions => Set<MobileMoneyTransaction>();
    public DbSet<DailyCollection> DailyCollections => Set<DailyCollection>();
    public DbSet<DailyCollectionPayment> DailyCollectionPayments => Set<DailyCollectionPayment>();
    public DbSet<InvoiceNote> InvoiceNotes => Set<InvoiceNote>();
    public DbSet<StaffAdvance> StaffAdvances => Set<StaffAdvance>();
    public DbSet<StaffMember> StaffMembers => Set<StaffMember>();
    public DbSet<PayrollRecord> PayrollRecords => Set<PayrollRecord>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<TeachingAllocation> TeachingAllocations => Set<TeachingAllocation>();
    public DbSet<LibraryBook> LibraryBooks => Set<LibraryBook>();
    public DbSet<LibraryLoan> LibraryLoans => Set<LibraryLoan>();
    public DbSet<Librarian> Librarians => Set<Librarian>();
    public DbSet<Certificate> Certificates => Set<Certificate>();
    public DbSet<Alumni> Alumni => Set<Alumni>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<GateLog> GateLogs => Set<GateLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<AssessmentWeightingProfile> AssessmentWeightingProfiles => Set<AssessmentWeightingProfile>();
    public DbSet<AssessmentWeightingComponent> AssessmentWeightingComponents => Set<AssessmentWeightingComponent>();
    public DbSet<AssessmentPlanWeightingProfile> AssessmentPlanWeightingProfiles => Set<AssessmentPlanWeightingProfile>();
    public DbSet<RegulatoryRegistration> RegulatoryRegistrations => Set<RegulatoryRegistration>();
    public DbSet<Assessment> RegulatoryAssessments => Set<Assessment>();
    public DbSet<ContinuousAssessment> ContinuousAssessments => Set<ContinuousAssessment>();
    public DbSet<AssessmentResult> AssessmentResults => Set<AssessmentResult>();
    public DbSet<AssessmentCentre> AssessmentCentres => Set<AssessmentCentre>();
    public DbSet<RegulatoryCircular> RegulatoryCirculars => Set<RegulatoryCircular>();
    public DbSet<AdmissionRequirement> AdmissionRequirements => Set<AdmissionRequirement>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<UserRole>(e =>
        {
            e.HasKey(x => new { x.UserId, x.RoleId });
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Role>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<AdmissionDecision>().HasOne<AdmissionEntity>().WithMany().HasForeignKey(x => x.AdmissionId).OnDelete(DeleteBehavior.Cascade);
        m.ApplyConfiguration(new AdmissionsConfiguration());
        m.ApplyConfiguration(new AdmissionDecisionConfiguration());

        AttendanceConfiguration.Apply(m);
        m.ApplyConfiguration(new AssessmentPlanConfiguration());
        m.ApplyConfiguration(new StudentAssessmentConfiguration());

        m.Entity<LibraryBook>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Isbn).IsUnique();
            e.Property(x => x.Isbn).HasMaxLength(32).IsRequired();
            e.Property(x => x.Title).HasMaxLength(250).IsRequired();
            e.Property(x => x.Author).HasMaxLength(200).IsRequired();
            e.Property(x => x.Publisher).HasMaxLength(200);
        });

        m.Entity<LibraryLoan>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.StudentId, x.BookId, x.ReturnedAtUtc });
            e.HasOne<LibraryBook>().WithMany().HasForeignKey(x => x.BookId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.FineAmount).HasPrecision(18, 2);
        });

        m.Entity<Librarian>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.StaffMemberId).IsUnique();
            e.Property(x => x.LibraryRole).HasMaxLength(80).IsRequired();
            e.HasOne<StaffMember>().WithMany().HasForeignKey(x => x.StaffMemberId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<AssessmentWeightingProfile>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.RegulatoryBody).HasMaxLength(80);
            e.Property(x => x.AssessmentModel).HasMaxLength(50);
            e.HasMany<AssessmentWeightingComponent>().WithOne().HasForeignKey(x => x.AssessmentWeightingProfileId).OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => new { x.Name, x.EffectiveFromUtc });
        });

        m.Entity<AssessmentWeightingComponent>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.AssessmentType).HasMaxLength(80).IsRequired();
            e.Property(x => x.WeightPercentage).HasPrecision(5, 2);
            e.Property(x => x.MaximumMark).HasPrecision(8, 2);
            e.HasIndex(x => new { x.AssessmentWeightingProfileId, x.Name }).IsUnique();
        });

        m.Entity<AssessmentPlanWeightingProfile>(e =>
        {
            e.HasKey(x => new { x.AssessmentPlanId, x.AssessmentWeightingProfileId });
            e.HasOne<AssessmentPlan>().WithMany().HasForeignKey(x => x.AssessmentPlanId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<AssessmentWeightingProfile>().WithMany().HasForeignKey(x => x.AssessmentWeightingProfileId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<ChartOfAccounts>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
        });

        m.Entity<Account>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.ChartOfAccountsId, x.Code }).IsUnique();
            e.Property(x => x.Code).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.AccountType).HasMaxLength(50).IsRequired();
            e.HasOne<ChartOfAccounts>().WithMany().HasForeignKey(x => x.ChartOfAccountsId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<JournalEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.EntryNumber).IsUnique();
            e.Property(x => x.EntryNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasMany<JournalEntryLine>().WithOne().HasForeignKey(x => x.JournalEntryId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<JournalEntryLine>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne<Account>().WithMany().HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Description).HasMaxLength(500);
        });

        m.Entity<Vendor>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.ContactPerson).HasMaxLength(150);
            e.Property(x => x.Phone).HasMaxLength(50);
            e.Property(x => x.Email).HasMaxLength(200);
        });

        m.Entity<Bill>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.BillNumber).IsUnique();
            e.Property(x => x.BillNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(10).IsRequired();
            e.HasOne<Vendor>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.Restrict);
            e.HasMany<BillPayment>().WithOne().HasForeignKey(x => x.BillId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<BillPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired();
            e.Property(x => x.Reference).HasMaxLength(100);
        });

        m.Entity<Budget>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(10).IsRequired();
            e.HasMany<BudgetLine>().WithOne().HasForeignKey(x => x.BudgetId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<BudgetLine>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne<Account>().WithMany().HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Category).HasMaxLength(100).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(500);
        });

        m.Entity<BankReconciliation>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(1000);
        });

        m.Entity<BankStatementLine>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne<BankReconciliation>().WithMany().HasForeignKey(x => x.BankReconciliationId).OnDelete(DeleteBehavior.Cascade);
            e.Property(x => x.Description).HasMaxLength(500);
            e.Property(x => x.TransactionType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Reference).HasMaxLength(100);
        });

        m.Entity<FeeItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.FeeType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.HasIndex(x => new { x.FeeStructureId, x.FeeType });
        });

        m.Entity<StudentFee>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FeeType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Name).HasMaxLength(160).IsRequired();
            e.Property(x => x.Amount).HasPrecision(18, 2);
            e.Property(x => x.PaidAmount).HasPrecision(18, 2);
            e.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            e.Property(x => x.Status).HasMaxLength(30).IsRequired();
            e.HasIndex(x => new { x.StudentId, x.StudentInvoiceId, x.FeeType });
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<CreditNote>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CreditNoteNumber).IsUnique();
            e.Property(x => x.CreditNoteNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Reason).HasMaxLength(500).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<Sponsorship>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.SponsorName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Type).HasMaxLength(20).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.StudentId, x.Status });
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<InstalmentPlan>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<InstalmentPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.PaymentMethod).HasMaxLength(40);
            e.HasIndex(x => new { x.InstalmentPlanId, x.Status });
            e.HasOne<InstalmentPlan>().WithMany().HasForeignKey(x => x.InstalmentPlanId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<MobileMoneyTransaction>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TransactionRef).IsUnique();
            e.Property(x => x.TransactionRef).HasMaxLength(50).IsRequired();
            e.Property(x => x.Provider).HasMaxLength(30).IsRequired();
            e.Property(x => x.PhoneNumber).HasMaxLength(20).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasIndex(x => new { x.StudentId, x.Status });
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<DailyCollection>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.CashierName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.HasIndex(x => new { x.CollectionDate, x.CashierUserId });
        });

        m.Entity<DailyCollectionPayment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.PaymentMethod).HasMaxLength(40).IsRequired();
            e.Property(x => x.ReceiptNumber).HasMaxLength(50);
            e.Property(x => x.Reference).HasMaxLength(100);
            e.HasOne<DailyCollection>().WithMany().HasForeignKey(x => x.DailyCollectionId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<InvoiceNote>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Note).HasMaxLength(1000).IsRequired();
            e.Property(x => x.CreatedBy).HasMaxLength(200);
            e.HasIndex(x => new { x.StudentInvoiceId, x.CreatedAt });
            e.HasOne<StudentInvoice>().WithMany().HasForeignKey(x => x.StudentInvoiceId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<StaffAdvance>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Reason).HasMaxLength(500).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.Currency).HasMaxLength(3).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.HasIndex(x => new { x.StaffMemberId, x.Status });
            e.HasOne<StaffMember>().WithMany().HasForeignKey(x => x.StaffMemberId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<RegulatoryRegistration>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.RegistrationNumber).IsUnique();
            e.Property(x => x.RegistrationNumber).HasMaxLength(100).IsRequired();
            e.Property(x => x.RegulatoryBody).HasMaxLength(100).IsRequired();
            e.Property(x => x.ProgrammeCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.ProgrammeName).HasMaxLength(200).IsRequired();
            e.Property(x => x.Level).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.Property(x => x.VerificationCode).HasMaxLength(100);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<Assessment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.AssessmentCode).IsUnique();
            e.Property(x => x.AssessmentCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.RegulatoryBody).HasMaxLength(100).IsRequired();
            e.Property(x => x.ProgrammeCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.AssessmentType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
        });

        m.Entity<ContinuousAssessment>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.AssessmentType).HasMaxLength(50).IsRequired();
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.AssessorRemarks).HasMaxLength(1000);
            e.Property(x => x.LogbookReference).HasMaxLength(100);
            e.Property(x => x.ReportReference).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<AssessmentResult>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.RegulatoryBody).HasMaxLength(100).IsRequired();
            e.Property(x => x.Grade).HasMaxLength(10).IsRequired();
            e.Property(x => x.Remarks).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<AssessmentCentre>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CentreCode).IsUnique();
            e.Property(x => x.CentreCode).HasMaxLength(50).IsRequired();
            e.Property(x => x.CentreName).HasMaxLength(200).IsRequired();
            e.Property(x => x.RegulatoryBody).HasMaxLength(100).IsRequired();
            e.Property(x => x.Address).HasMaxLength(500).IsRequired();
            e.Property(x => x.ContactPerson).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(20);
            e.Property(x => x.Email).HasMaxLength(100);
            e.Property(x => x.Status).HasMaxLength(20).IsRequired();
        });

        m.Entity<RegulatoryCircular>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.CircularNumber).IsUnique();
            e.Property(x => x.CircularNumber).HasMaxLength(50).IsRequired();
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.RegulatoryBody).HasMaxLength(100).IsRequired();
            e.Property(x => x.Content).HasMaxLength(4000).IsRequired();
            e.Property(x => x.AttachmentUrl).HasMaxLength(500);
        });

        m.Entity<AdmissionRequirement>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.RequirementType).HasMaxLength(100).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000).IsRequired();
            e.HasIndex(x => new { x.ProgrammeId, x.DisplayOrder });
        });
    }
}
