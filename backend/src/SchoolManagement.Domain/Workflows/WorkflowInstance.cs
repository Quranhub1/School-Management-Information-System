namespace SchoolManagement.Domain.Workflows;

public sealed class WorkflowInstance
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string WorkflowType { get; init; }
    public required string EntityType { get; init; }
    public Guid EntityId { get; init; }
    public required string CurrentState { get; init; }
    public Guid? AssignedToUserId { get; init; }
    public string? Comments { get; init; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UpdatedAt { get; init; }
    public Guid? CreatedByUserId { get; init; }
    public bool IsCompleted { get; set; }
}
