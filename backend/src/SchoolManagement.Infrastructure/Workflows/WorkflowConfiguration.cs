using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SchoolManagement.Domain.Workflows;

namespace SchoolManagement.Infrastructure.Workflows;

public sealed class WorkflowConfiguration : IEntityTypeConfiguration<WorkflowInstance>
{
    public void Configure(EntityTypeBuilder<WorkflowInstance> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.WorkflowType, x.EntityType, x.EntityId });
        builder.Property(x => x.WorkflowType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CurrentState).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Comments).HasMaxLength(1000);
        builder.HasMany<WorkflowHistory>()
            .WithOne()
            .HasForeignKey(x => x.WorkflowInstanceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
