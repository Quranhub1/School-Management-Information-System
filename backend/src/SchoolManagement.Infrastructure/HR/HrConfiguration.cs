using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Infrastructure.HR;

public sealed class HrConfiguration : IEntityTypeConfiguration<StaffMember>
{
    public void Configure(EntityTypeBuilder<StaffMember> builder)
    {
        builder.ToTable("staff_members");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.StaffNumber)
            .HasMaxLength(50)
            .IsRequired();
        builder.HasIndex(x => x.StaffNumber).IsUnique();

        builder.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.NationalId).HasMaxLength(50);
        builder.Property(x => x.PhoneNumber).HasMaxLength(40);
        builder.Property(x => x.Email).HasMaxLength(254);
        builder.Property(x => x.EmploymentType).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => new { x.IsActive, x.LastName, x.FirstName });
    }
}