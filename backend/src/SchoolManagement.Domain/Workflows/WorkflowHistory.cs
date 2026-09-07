namespace SchoolManagement.Domain.Workflows;

public sealed class WorkflowHistory
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid WorkflowInstanceId { get; init; }
    public required string FromState { get; init; }
    public required string ToState { get; init; }
    public Guid? PerformedByUserId { get; init; }
    public string? Comments { get; init; }
    public DateTimeOffset PerformedAt { get; init; } = DateTimeOffset.UtcNow;
}
