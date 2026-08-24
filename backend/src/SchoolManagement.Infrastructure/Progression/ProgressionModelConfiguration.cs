using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Progression;

namespace SchoolManagement.Infrastructure.Progression;

public sealed class ProgressionModelConfiguration : IEntityTypeConfiguration<SemesterProgressionDecision>
{
    public void Configure(EntityTypeBuilder<SemesterProgressionDecision> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PassRate).HasPrecision(5, 2);
        builder.Property(x => x.Outcome).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Reason).HasMaxLength(1000);
        builder.HasIndex(x => new { x.StudentId, x.FromSemesterId }).IsUnique();
    }
}
