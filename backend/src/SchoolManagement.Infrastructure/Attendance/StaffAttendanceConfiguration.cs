using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Attendance;

namespace SchoolManagement.Infrastructure.Attendance;

public static class StaffAttendanceConfiguration
{
    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StaffAttendanceEvent>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.EventType).HasMaxLength(10).IsRequired();
            entity.Property(x => x.DeviceId).HasMaxLength(100).IsRequired();
            entity.Property(x => x.CaptureId).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Source).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => new { x.DeviceId, x.CaptureId }).IsUnique();
            entity.HasIndex(x => new { x.StaffMemberId, x.RecordedAtUtc });
            entity.HasOne<SchoolManagement.Domain.Staff.StaffMember>()
                .WithMany().HasForeignKey(x => x.StaffMemberId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StaffFingerprintCredential>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.DeviceFamily).HasMaxLength(80).IsRequired();
            entity.Property(x => x.TemplateFormat).HasMaxLength(80).IsRequired();
            entity.Property(x => x.EncryptedTemplate).HasColumnType("bytea").IsRequired();
            entity.HasIndex(x => new { x.StaffMemberId, x.IsActive });
            entity.HasOne<SchoolManagement.Domain.Staff.StaffMember>()
                .WithMany().HasForeignKey(x => x.StaffMemberId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
