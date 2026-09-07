using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Academic;
using AcademicStream = SchoolManagement.Domain.Academic.Stream;

namespace SchoolManagement.Infrastructure.Academic;

public sealed class AcademicClassConfiguration : IEntityTypeConfiguration<AcademicClass>
{
    public void Configure(EntityTypeBuilder<AcademicClass> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200);
        builder.HasIndex(x => new { x.ProgrammeId, x.AcademicPeriodId, x.Code }).IsUnique();
        builder.HasOne<Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Semester>().WithMany().HasForeignKey(x => x.AcademicPeriodId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class StreamConfiguration : IEntityTypeConfiguration<AcademicStream>
{
    public void Configure(EntityTypeBuilder<AcademicStream> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200);
        builder.HasIndex(x => new { x.AcademicClassId, x.Code }).IsUnique();
        builder.HasOne<AcademicClass>().WithMany().HasForeignKey(x => x.AcademicClassId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class SubjectConfiguration : IEntityTypeConfiguration<Subject>
{
    public void Configure(EntityTypeBuilder<Subject> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ElectiveGroup).HasMaxLength(80);
        builder.HasIndex(x => new { x.ProgrammeId, x.CourseId }).IsUnique();
        builder.HasOne<Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<Course>().WithMany().HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Restrict);
    }
}
