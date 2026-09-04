using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Infrastructure.Certificates;

public sealed class CertificateConfiguration : IEntityTypeConfiguration<Certificate>
{
    public void Configure(EntityTypeBuilder<Certificate> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.SerialNumber).IsUnique();
        builder.HasIndex(x => x.VerificationHash).IsUnique();
        builder.Property(x => x.SerialNumber).HasMaxLength(80).IsRequired();
        builder.Property(x => x.VerificationHash).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Programme).HasMaxLength(200).IsRequired();
        builder.Property(x => x.AwardType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.IssuedBy).HasMaxLength(150).IsRequired();
        builder.Property(x => x.RevokedBy).HasMaxLength(150);
        builder.Property(x => x.RevocationReason).HasMaxLength(500);
        builder.HasOne<Student>()
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
