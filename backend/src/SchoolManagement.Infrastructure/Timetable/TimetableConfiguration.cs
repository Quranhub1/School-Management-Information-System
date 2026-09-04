using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Infrastructure.Timetable;

public sealed class TimetableConfiguration : IEntityTypeConfiguration<TimetableEntry>
{
    public void Configure(EntityTypeBuilder<TimetableEntry> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Room).HasMaxLength(100);
        builder.Property(x => x.SessionType).HasMaxLength(60);
        builder.Property(x => x.GeneratedAt);
        builder.Property(x => x.GenerationSource).HasMaxLength(100);
        builder.HasIndex(x => new { x.TeachingGroupId, x.DayOfWeek, x.StartTime });
        builder.HasIndex(x => new { x.DayOfWeek, x.Room, x.StartTime, x.EndTime, x.IsActive });
        builder.HasIndex(x => new { x.CourseId, x.TeacherId, x.DayOfWeek, x.StartTime, x.EndTime, x.IsActive });
        builder.HasOne<TeachingGroup>()
            .WithMany()
            .HasForeignKey(x => x.TeachingGroupId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Course>()
            .WithMany()
            .HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<StaffMember>()
            .WithMany()
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
