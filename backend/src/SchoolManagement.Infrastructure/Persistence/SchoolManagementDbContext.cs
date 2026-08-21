using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Attendance;
using SchoolManagement.Domain.Clinical;
using SchoolManagement.Domain.Examinations;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Domain.Students;

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
    public DbSet<StudentAcademicStatus> StudentAcademicStatuses => Set<StudentAcademicStatus>();
    public DbSet<LearningOutcome> LearningOutcomes => Set<LearningOutcome>();
    public DbSet<AssessmentPlan> AssessmentPlans => Set<AssessmentPlan>();
    public DbSet<StudentAssessment> StudentAssessments => Set<StudentAssessment>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<Placement> Placements => Set<Placement>();
    public DbSet<StudentPlacement> StudentPlacements => Set<StudentPlacement>();
    public DbSet<Result> Results => Set<Result>();
    public DbSet<FeeStructure> FeeStructures => Set<FeeStructure>();
    public DbSet<StudentInvoice> StudentInvoices => Set<StudentInvoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<StaffMember> StaffMembers => Set<StaffMember>();
    public DbSet<TeachingAllocation> TeachingAllocations => Set<TeachingAllocation>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<User>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Username).IsUnique(); e.Property(x => x.Username).HasMaxLength(100).IsRequired(); e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired(); e.Property(x => x.FirstName).HasMaxLength(100).IsRequired(); e.Property(x => x.LastName).HasMaxLength(100).IsRequired(); e.Property(x => x.Email).HasMaxLength(254); });
        m.Entity<Role>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Name).IsUnique(); e.Property(x => x.Name).HasMaxLength(100).IsRequired(); });
        m.Entity<UserRole>(e => { e.HasKey(x => new { x.UserId, x.RoleId }); e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId); e.HasOne<Role>().WithMany().HasForeignKey(x => x.RoleId); });
        m.Entity<Applicant>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.ApplicationNumber).IsUnique(); e.Property(x => x.ApplicationNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.FirstName).HasMaxLength(100).IsRequired(); e.Property(x => x.LastName).HasMaxLength(100).IsRequired(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<Student>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.StudentNumber).IsUnique(); e.Property(x => x.StudentNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.FirstName).HasMaxLength(100).IsRequired(); e.Property(x => x.LastName).HasMaxLength(100).IsRequired(); });
        m.Entity<StudentGuardian>(e => { e.HasKey(x => x.Id); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<Faculty>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); });
        m.Entity<Department>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); e.HasOne<Faculty>().WithMany().HasForeignKey(x => x.FacultyId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<Programme>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(50).IsRequired(); e.Property(x => x.Name).HasMaxLength(250).IsRequired(); e.Property(x => x.Award).HasMaxLength(150).IsRequired(); e.HasOne<Department>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<AcademicYear>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Name).IsUnique(); e.Property(x => x.Name).HasMaxLength(30).IsRequired(); });
        m.Entity<Semester>(e => { e.HasKey(x => x.Id); e.HasOne<AcademicYear>().WithMany().HasForeignKey(x => x.AcademicYearId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<Intake>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); });
        m.Entity<Course>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(50).IsRequired(); e.Property(x => x.Name).HasMaxLength(250).IsRequired(); });
        m.Entity<Curriculum>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.ProgrammeId, x.Version }).IsUnique(); e.Property(x => x.Version).HasMaxLength(30).IsRequired(); e.Property(x => x.Title).HasMaxLength(250).IsRequired(); e.HasOne<Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<CurriculumCourse>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.CurriculumId, x.CourseId }).IsUnique(); e.HasOne<Curriculum>().WithMany().HasForeignKey(x => x.CurriculumId).OnDelete(DeleteBehavior.Cascade); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<Admission>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.AdmissionNumber).IsUnique(); e.Property(x => x.AdmissionNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.AdmissionType).HasMaxLength(50).IsRequired(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<StudentEnrollment>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.ProgrammeId, x.IntakeId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<CourseRegistration>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.CourseId, x.SemesterId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<CourseOffering>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.OfferingCode).IsUnique(); e.HasIndex(x => new { x.CourseId, x.SemesterId, x.ProgrammeId }).IsUnique(); e.Property(x => x.OfferingCode).HasMaxLength(50).IsRequired(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Semester>().WithMany().HasForeignKey(x => x.SemesterId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<TeachingGroup>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.CourseOfferingId, x.GroupCode }).IsUnique(); e.Property(x => x.GroupCode).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(100); e.HasOne<CourseOffering>().WithMany().HasForeignKey(x => x.CourseOfferingId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<StudentAcademicStatus>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.SemesterId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.Property(x => x.Gpa).HasPrecision(5, 2); e.Property(x => x.CumulativeGpa).HasPrecision(5, 2); });
        m.Entity<LearningOutcome>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.CourseId, x.Code }).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); e.Property(x => x.Description).HasMaxLength(1000).IsRequired(); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<AssessmentPlan>(e => { e.HasKey(x => x.Id); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); e.Property(x => x.AssessmentType).HasMaxLength(50).IsRequired(); e.Property(x => x.WeightPercentage).HasPrecision(5, 2); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<StudentAssessment>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.CourseRegistrationId, x.AssessmentPlanId }).IsUnique(); e.Property(x => x.Score).HasPrecision(8, 2); e.Property(x => x.MaximumScore).HasPrecision(8, 2); e.Property(x => x.Grade).HasMaxLength(20); e.Property(x => x.CompetencyLevel).HasMaxLength(50); });
        m.Entity<AttendanceRecord>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.CourseId, x.SemesterId, x.AttendanceDate }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<Placement>(e => { e.HasKey(x => x.Id); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); e.Property(x => x.FacilityName).HasMaxLength(250); e.Property(x => x.FacilityType).HasMaxLength(100); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<StudentPlacement>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.PlacementId, x.StudentId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.Property(x => x.CompetencyOutcome).HasMaxLength(1000); });
        m.Entity<Result>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.CourseId, x.SemesterId }).IsUnique(); e.Property(x => x.Score).HasPrecision(8, 2); e.Property(x => x.Grade).HasMaxLength(20); e.Property(x => x.GradePoint).HasPrecision(5, 2); });
        m.Entity<FeeStructure>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.ProgrammeId, x.AcademicYearId, x.Name }).IsUnique(); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); e.Property(x => x.TotalAmount).HasPrecision(18, 2); e.Property(x => x.Currency).HasMaxLength(3).IsRequired(); });
        m.Entity<StudentInvoice>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.InvoiceNumber).IsUnique(); e.Property(x => x.InvoiceNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.Amount).HasPrecision(18, 2); e.Property(x => x.PaidAmount).HasPrecision(18, 2); e.Property(x => x.Currency).HasMaxLength(3).IsRequired(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); });
        m.Entity<Payment>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.ReceiptNumber).IsUnique(); e.Property(x => x.ReceiptNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.Amount).HasPrecision(18, 2); e.Property(x => x.Currency).HasMaxLength(3).IsRequired(); e.Property(x => x.PaymentMethod).HasMaxLength(50).IsRequired(); e.Property(x => x.Reference).HasMaxLength(100); });
        m.Entity<StaffMember>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.StaffNumber).IsUnique(); e.Property(x => x.StaffNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.FirstName).HasMaxLength(100).IsRequired(); e.Property(x => x.LastName).HasMaxLength(100).IsRequired(); e.Property(x => x.NationalId).HasMaxLength(50); e.Property(x => x.PhoneNumber).HasMaxLength(30); e.Property(x => x.Email).HasMaxLength(254); e.Property(x => x.EmploymentType).HasMaxLength(50).IsRequired(); });
        m.Entity<TeachingAllocation>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StaffMemberId, x.CourseId, x.SemesterId }).IsUnique(); e.Property(x => x.Role).HasMaxLength(50).IsRequired(); e.HasOne<StaffMember>().WithMany().HasForeignKey(x => x.StaffMemberId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Semester>().WithMany().HasForeignKey(x => x.SemesterId).OnDelete(DeleteBehavior.Restrict); });
    }
}
