using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Infrastructure.Attendance;

public static class AttendanceConfiguration
{
    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AttendanceSession>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.TimetableEntryId, x.SessionDate }).IsUnique();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Remarks).HasMaxLength(500);
            entity.Property(x => x.RotationIntervalMinutes);
            entity.Property(x => x.QrGeneratedAt);
            entity.HasOne<SchoolManagement.Domain.Academic.TimetableEntry>()
                .WithMany()
                .HasForeignKey(x => x.TimetableEntryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StudentAttendance>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.AttendanceSessionId, x.StudentId }).IsUnique();
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Remarks).HasMaxLength(500);
            entity.HasOne<AttendanceSession>()
                .WithMany()
                .HasForeignKey(x => x.AttendanceSessionId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<SchoolManagement.Domain.Students.Student>()
                .WithMany()
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AttendanceQrSession>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.QrToken).IsUnique();
            entity.Property(x => x.QrToken).HasMaxLength(256).IsRequired();
            entity.Property(x => x.QrSecret).HasMaxLength(256).IsRequired();
            entity.Property(x => x.RotationIntervalMinutes).IsRequired();
            entity.Property(x => x.IsUsed).IsRequired();
            entity.HasOne<AttendanceSession>()
                .WithMany()
                .HasForeignKey(x => x.AttendanceSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
