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
    public DbSet<TimetableEntry> TimetableEntries => Set<TimetableEntry>();
    public DbSet<AttendanceSession> AttendanceSessions => Set<AttendanceSession>();
    public DbSet<StudentAttendance> StudentAttendances => Set<StudentAttendance>();
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
        m.Entity<UserRole>(e => { e.HasKey(x => new { x.UserId, x.RoleId }); e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade); e.HasOne<Role>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<TimetableEntry>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.TeachingGroupId, x.DayOfWeek, x.StartTime }).IsUnique(); e.Property(x => x.Room).HasMaxLength(100); e.Property(x => x.SessionType).HasMaxLength(50); e.HasOne<TeachingGroup>().WithMany().HasForeignKey(x => x.TeachingGroupId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<TeachingGroup>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.CourseOfferingId, x.GroupCode }).IsUnique(); e.Property(x => x.GroupCode).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(100); e.HasOne<CourseOffering>().WithMany().HasForeignKey(x => x.CourseOfferingId).OnDelete(DeleteBehavior.Cascade); });
        m.Entity<AttendanceSession>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.TimetableEntryId, x.SessionDate }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.Property(x => x.Remarks).HasMaxLength(500); e.HasOne<TimetableEntry>().WithMany().HasForeignKey(x => x.TimetableEntryId).OnDelete(DeleteBehavior.Restrict); });
        m.Entity<StudentAttendance>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.AttendanceSessionId, x.StudentId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.Property(x => x.Remarks).HasMaxLength(500); e.HasOne<AttendanceSession>().WithMany().HasForeignKey(x => x.AttendanceSessionId).OnDelete(DeleteBehavior.Cascade); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict); });
    }
}
