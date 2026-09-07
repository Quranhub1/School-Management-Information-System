namespace SchoolManagement.Domain.Identity;

public sealed class Permission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; init; }
    public required string Name { get; init; }
    public string? Description { get; init; }
}
