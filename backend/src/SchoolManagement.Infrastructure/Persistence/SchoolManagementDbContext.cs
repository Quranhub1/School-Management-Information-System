using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.Library;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Attendance;
using SchoolManagement.Infrastructure.Assessment;
using AssessmentGradingScale = SchoolManagement.Domain.Assessment.GradingScale;
using AssessmentGradeBand = SchoolManagement.Domain.Assessment.GradeBand;
using AssessmentTranscriptEntry = SchoolManagement.Domain.Assessment.TranscriptEntry;
using AssessmentAcademicResultSummary = SchoolManagement.Domain.Assessment.AcademicResultSummary;

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
    public DbSet<Admission> Admissions => Set<Admission>();
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
    public DbSet<StudentInvoice> StudentInvoices => Set<StudentInvoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<StaffMember> StaffMembers => Set<StaffMember>();
    public DbSet<TeachingAllocation> TeachingAllocations => Set<TeachingAllocation>();
    public DbSet<LibraryBook> LibraryBooks => Set<LibraryBook>();
    public DbSet<LibraryLoan> LibraryLoans => Set<LibraryLoan>();
    public DbSet<Librarian> Librarians => Set<Librarian>();
    public DbSet<AssessmentWeightingProfile> AssessmentWeightingProfiles => Set<AssessmentWeightingProfile>();
    public DbSet<AssessmentWeightingComponent> AssessmentWeightingComponents => Set<AssessmentWeightingComponent>();
    public DbSet<AssessmentPlanWeightingProfile> AssessmentPlanWeightingProfiles => Set<AssessmentPlanWeightingProfile>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<UserRole>(e =>
        {
            e.HasKey(x => new { x.UserId, x.RoleId });
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<Role>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<StudentPromotion>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.StudentId, x.FromAcademicYearId, x.FromSemesterId }).IsUnique();
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
            e.Property(x => x.Reason).HasMaxLength(1000);
            e.Property(x => x.RecordedBy).HasMaxLength(150);
            e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<AcademicYear>().WithMany().HasForeignKey(x => x.FromAcademicYearId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Semester>().WithMany().HasForeignKey(x => x.FromSemesterId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<AcademicYear>().WithMany().HasForeignKey(x => x.ToAcademicYearId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Semester>().WithMany().HasForeignKey(x => x.ToSemesterId).OnDelete(DeleteBehavior.Restrict);
        });

        m.Entity<TimetableEntry>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.TeachingGroupId, x.DayOfWeek, x.StartTime }).IsUnique();
            e.Property(x => x.Room).HasMaxLength(100);
            e.Property(x => x.SessionType).HasMaxLength(50);
            e.HasOne<TeachingGroup>().WithMany().HasForeignKey(x => x.TeachingGroupId).OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<TeachingGroup>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.CourseOfferingId, x.GroupCode }).IsUnique();
            e.Property(x => x.GroupCode).HasMaxLength(30).IsRequired();
            e.Property(x => x.Name).HasMaxLength(100);
            e.HasOne<CourseOffering>().WithMany().HasForeignKey(x => x.CourseOfferingId).OnDelete(DeleteBehavior.Cascade);
        });

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
    }
}
