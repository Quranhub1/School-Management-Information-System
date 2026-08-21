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
    public DbSet<Registration> Registrations => Set<Registration>();
    public DbSet<SchoolManagement.Domain.Academic.CourseRegistration> CourseRegistrations => Set<SchoolManagement.Domain.Academic.CourseRegistration>();
    public DbSet<RegistrationStatusHistory> RegistrationStatusHistories => Set<RegistrationStatusHistory>();
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
        m.Entity<Registration>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.RegistrationNumber).IsUnique(); e.Property(x => x.RegistrationNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict); e.HasOne<AcademicYear>().WithMany().HasForeignKey(x => x.AcademicYearId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Semester>().WithMany().HasForeignKey(x => x.SemesterId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<SchoolManagement.Domain.Academic.CourseRegistration>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.CourseId, x.SemesterId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Semester>().WithMany().HasForeignKey(x => x.SemesterId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<RegistrationStatusHistory>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.RegistrationId, x.ChangedAt }); e.Property(x => x.FromStatus).HasMaxLength(30).IsRequired(); e.Property(x => x.ToStatus).HasMaxLength(30).IsRequired(); e.Property(x => x.Reason).HasMaxLength(500); e.HasOne<Registration>().WithMany().HasForeignKey(x => x.RegistrationId).OnDelete(DeleteBehavior.Cascade); });
    }
}
