using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContext(DbContextOptions<SchoolManagementDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>(); public DbSet<Role> Roles => Set<Role>(); public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Student> Students => Set<Student>(); public DbSet<StudentGuardian> StudentGuardians => Set<StudentGuardian>();
    public DbSet<Faculty> Faculties => Set<Faculty>(); public DbSet<Department> Departments => Set<Department>(); public DbSet<Programme> Programmes => Set<Programme>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>(); public DbSet<Semester> Semesters => Set<Semester>(); public DbSet<Intake> Intakes => Set<Intake>();
    public DbSet<Course> Courses => Set<Course>(); public DbSet<Curriculum> Curricula => Set<Curriculum>(); public DbSet<CurriculumCourse> CurriculumCourses => Set<CurriculumCourse>();
    public DbSet<Admission> Admissions => Set<Admission>(); public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>(); public DbSet<CourseRegistration> CourseRegistrations => Set<CourseRegistration>();
    public DbSet<StudentAcademicStatus> StudentAcademicStatuses => Set<StudentAcademicStatus>();

    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<User>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Username).IsUnique();e.Property(x=>x.Username).HasMaxLength(100).IsRequired();e.Property(x=>x.PasswordHash).HasMaxLength(500).IsRequired();e.Property(x=>x.FirstName).HasMaxLength(100).IsRequired();e.Property(x=>x.LastName).HasMaxLength(100).IsRequired();e.Property(x=>x.Email).HasMaxLength(254);});
        m.Entity<Role>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Name).IsUnique();e.Property(x=>x.Name).HasMaxLength(100).IsRequired();});
        m.Entity<UserRole>(e=>{e.HasKey(x=>new{x.UserId,x.RoleId});e.HasOne<User>().WithMany().HasForeignKey(x=>x.UserId);e.HasOne<Role>().WithMany().HasForeignKey(x=>x.RoleId);});
        m.Entity<Student>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.StudentNumber).IsUnique();e.Property(x=>x.StudentNumber).HasMaxLength(50).IsRequired();e.Property(x=>x.FirstName).HasMaxLength(100).IsRequired();e.Property(x=>x.LastName).HasMaxLength(100).IsRequired();});
        m.Entity<StudentGuardian>(e=>{e.HasKey(x=>x.Id);e.HasOne<Student>().WithMany().HasForeignKey(x=>x.StudentId).OnDelete(DeleteBehavior.Cascade);});
        m.Entity<Faculty>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Code).IsUnique();e.Property(x=>x.Code).HasMaxLength(30).IsRequired();e.Property(x=>x.Name).HasMaxLength(200).IsRequired();});
        m.Entity<Department>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Code).IsUnique();e.Property(x=>x.Code).HasMaxLength(30).IsRequired();e.HasOne<Faculty>().WithMany().HasForeignKey(x=>x.FacultyId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<Programme>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Code).IsUnique();e.Property(x=>x.Code).HasMaxLength(50).IsRequired();e.Property(x=>x.Name).HasMaxLength(250).IsRequired();e.Property(x=>x.Award).HasMaxLength(150).IsRequired();e.HasOne<Department>().WithMany().HasForeignKey(x=>x.DepartmentId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<AcademicYear>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Name).IsUnique();e.Property(x=>x.Name).HasMaxLength(30).IsRequired();});
        m.Entity<Semester>(e=>{e.HasKey(x=>x.Id);e.HasOne<AcademicYear>().WithMany().HasForeignKey(x=>x.AcademicYearId).OnDelete(DeleteBehavior.Cascade);});
        m.Entity<Intake>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Code).IsUnique();e.Property(x=>x.Code).HasMaxLength(30).IsRequired();});
        m.Entity<Course>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.Code).IsUnique();e.Property(x=>x.Code).HasMaxLength(50).IsRequired();e.Property(x=>x.Name).HasMaxLength(250).IsRequired();});
        m.Entity<Curriculum>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.ProgrammeId,x.Version}).IsUnique();e.Property(x=>x.Version).HasMaxLength(30).IsRequired();e.Property(x=>x.Title).HasMaxLength(250).IsRequired();e.HasOne<Programme>().WithMany().HasForeignKey(x=>x.ProgrammeId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<CurriculumCourse>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.CurriculumId,x.CourseId}).IsUnique();e.HasOne<Curriculum>().WithMany().HasForeignKey(x=>x.CurriculumId).OnDelete(DeleteBehavior.Cascade);e.HasOne<Course>().WithMany().HasForeignKey(x=>x.CourseId).OnDelete(DeleteBehavior.Restrict);});
        m.Entity<Admission>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>x.AdmissionNumber).IsUnique();e.Property(x=>x.AdmissionNumber).HasMaxLength(50).IsRequired();e.Property(x=>x.AdmissionType).HasMaxLength(50).IsRequired();e.Property(x=>x.Status).HasMaxLength(30).IsRequired();});
        m.Entity<StudentEnrollment>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.StudentId,x.ProgrammeId,x.IntakeId}).IsUnique();e.Property(x=>x.Status).HasMaxLength(30).IsRequired();});
        m.Entity<CourseRegistration>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.StudentId,x.CourseId,x.SemesterId}).IsUnique();e.Property(x=>x.Status).HasMaxLength(30).IsRequired();});
        m.Entity<StudentAcademicStatus>(e=>{e.HasKey(x=>x.Id);e.HasIndex(x=>new{x.StudentId,x.SemesterId}).IsUnique();e.Property(x=>x.Status).HasMaxLength(30).IsRequired();e.Property(x=>x.Gpa).HasPrecision(5,2);e.Property(x=>x.CumulativeGpa).HasPrecision(5,2);});
    }
}
