using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Admissions;

namespace SchoolManagement.Infrastructure.Admissions;

public sealed class AdmissionsConfiguration : IEntityTypeConfiguration<Admission>
{
    public void Configure(EntityTypeBuilder<Admission> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => new { x.ApplicantId, x.ProgrammeId, x.AcademicYearId, x.IntakeId }).IsUnique();
        builder.HasOne<Applicant>().WithMany().HasForeignKey(x => x.ApplicantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<SchoolManagement.Domain.Academic.Programme>().WithMany().HasForeignKey(x => x.ProgrammeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<SchoolManagement.Domain.Academic.AcademicYear>().WithMany().HasForeignKey(x => x.AcademicYearId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<SchoolManagement.Domain.Academic.Intake>().WithMany().HasForeignKey(x => x.IntakeId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class AdmissionDecisionConfiguration : IEntityTypeConfiguration<AdmissionDecision>
{
    public void Configure(EntityTypeBuilder<AdmissionDecision> builder)
    {
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Decision).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Reason).HasMaxLength(1000);
        builder.Property(x => x.DecidedBy).HasMaxLength(160);
        builder.HasIndex(x => new { x.AdmissionId, x.Decision });
        builder.HasOne<Admission>().WithMany().HasForeignKey(x => x.AdmissionId).OnDelete(DeleteBehavior.Cascade);
    }
}
