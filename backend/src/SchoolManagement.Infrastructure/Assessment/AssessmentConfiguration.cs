using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Infrastructure.Assessment;

public sealed class AssessmentPlanConfiguration : IEntityTypeConfiguration<AssessmentPlan>
{
    public void Configure(EntityTypeBuilder<AssessmentPlan> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
        builder.Property(x => x.AssessmentType).HasMaxLength(80).IsRequired();
        builder.Property(x => x.WeightPercentage).HasPrecision(5, 2);
        builder.HasIndex(x => new { x.CourseId, x.Name }).IsUnique();
        builder.HasIndex(x => new { x.CourseId, x.IsActive });
    }
}

public sealed class StudentAssessmentConfiguration : IEntityTypeConfiguration<StudentAssessment>
{
    public void Configure(EntityTypeBuilder<StudentAssessment> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Score).HasPrecision(10, 2);
        builder.Property(x => x.MaximumScore).HasPrecision(10, 2);
        builder.Property(x => x.Grade).HasMaxLength(20);
        builder.Property(x => x.CompetencyLevel).HasMaxLength(80);
        builder.HasIndex(x => new { x.StudentId, x.CourseRegistrationId, x.AssessmentPlanId }).IsUnique();
        builder.HasIndex(x => new { x.CourseRegistrationId, x.RecordedAt });
    }
}
