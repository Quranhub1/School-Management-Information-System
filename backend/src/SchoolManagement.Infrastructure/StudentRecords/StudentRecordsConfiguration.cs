using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Infrastructure.StudentRecords;

public sealed class StudentRecordsConfiguration : IEntityTypeConfiguration<StudentGuardian>
{
    public void Configure(EntityTypeBuilder<StudentGuardian> builder)
    {
        builder.ToTable("student_guardians");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.Relationship)
            .HasMaxLength(80);

        builder.Property(x => x.PhoneNumber)
            .HasMaxLength(40);

        builder.Property(x => x.Email)
            .HasMaxLength(254);

        builder.HasIndex(x => x.StudentId);
        builder.HasIndex(x => new { x.StudentId, x.IsPrimary })
            .HasFilter("\"IsPrimary\" = true");
        builder.HasOne<Student>()
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
