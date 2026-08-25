using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Infrastructure.Timetable;

public sealed class TimetableConfiguration : IEntityTypeConfiguration<TimetableEntry>
{
    public void Configure(EntityTypeBuilder<TimetableEntry> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Room).HasMaxLength(100);
        builder.Property(x => x.SessionType).HasMaxLength(60);
        builder.HasIndex(x => new { x.TeachingGroupId, x.DayOfWeek, x.StartTime });
        builder.HasIndex(x => new { x.DayOfWeek, x.Room, x.StartTime, x.EndTime, x.IsActive });
        builder.HasOne<TeachingGroup>()
            .WithMany()
            .HasForeignKey(x => x.TeachingGroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
