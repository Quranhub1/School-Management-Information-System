using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContext(DbContextOptions<SchoolManagementDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<StudentGuardian> StudentGuardians => Set<StudentGuardian>();
    public DbSet<Faculty> Faculties => Set<Faculty>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Programme> Programmes => Set<Programme>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<Intake> Intakes => Set<Intake>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
    public DbSet<CourseRegistration> CourseRegistrations => Set<CourseRegistration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Username).IsUnique(); e.Property(x => x.Username).HasMaxLength(100).IsRequired(); e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired(); e.Property(x => x.FirstName).HasMaxLength(100).IsRequired(); e.Property(x => x.LastName).HasMaxLength(100).IsRequired(); e.Property(x => x.Email).HasMaxLength(254); });
        modelBuilder.Entity<Role>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Name).IsUnique(); e.Property(x => x.Name).HasMaxLength(100).IsRequired(); });
        modelBuilder.Entity<UserRole>(e => { e.HasKey(x => new { x.UserId, x.RoleId }); e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId); e.HasOne<Role>().WithMany().HasForeignKey(x => x.RoleId); });
        modelBuilder.Entity<Student>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.StudentNumber).IsUnique(); e.Property(x => x.StudentNumber).HasMaxLength(50).IsRequired(); e.Property(x => x.FirstName).HasMaxLength(100).IsRequired(); e.Property(x => x.LastName).HasMaxLength(100).IsRequired(); });
        modelBuilder.Entity<StudentGuardian>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.StudentId); e.Property(x => x.FullName).HasMaxLength(200).IsRequired(); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Cascade); });
        modelBuilder.Entity<Faculty>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); });
        modelBuilder.Entity<Department>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(200).IsRequired(); e.HasOne<Faculty>().WithMany().HasForeignKey(x => x.FacultyId).OnDelete(DeleteBehavior.Restrict); });
        modelBuilder.Entity<Programme>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(50).IsRequired(); e.Property(x => x.Name).HasMaxLength(250).IsRequired(); e.Property(x => x.Award).HasMaxLength(150).IsRequired(); e.HasOne<Department>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict); });
        modelBuilder.Entity<AcademicYear>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Name).IsUnique(); e.Property(x => x.Name).HasMaxLength(30).IsRequired(); });
        modelBuilder.Entity<Semester>(e => { e.HasKey(x => x.Id); e.HasOne<AcademicYear>().WithMany().HasForeignKey(x => x.AcademicYearId).OnDelete(DeleteBehavior.Cascade); });
        modelBuilder.Entity<Intake>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(30).IsRequired(); e.Property(x => x.Name).HasMaxLength(100).IsRequired(); });
        modelBuilder.Entity<Course>(e => { e.HasKey(x => x.Id); e.HasIndex(x => x.Code).IsUnique(); e.Property(x => x.Code).HasMaxLength(50).IsRequired(); e.Property(x => x.Name).HasMaxLength(250).IsRequired(); });
        modelBuilder.Entity<StudentEnrollment>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.ProgrammeId, x.IntakeId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Intake>().WithMany().HasForeignKey(x => x.IntakeId).OnDelete(DeleteBehavior.Restrict); });
        modelBuilder.Entity<CourseRegistration>(e => { e.HasKey(x => x.Id); e.HasIndex(x => new { x.StudentId, x.CourseId, x.SemesterId }).IsUnique(); e.Property(x => x.Status).HasMaxLength(30).IsRequired(); e.HasOne<Student>().WithMany().HasForeignKey(x => x.StudentId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict); e.HasOne<Semester>().WithMany().HasForeignKey(x => x.SemesterId).OnDelete(DeleteBehavior.Restrict); });
    }
}
