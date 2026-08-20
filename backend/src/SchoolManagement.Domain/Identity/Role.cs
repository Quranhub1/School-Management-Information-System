namespace SchoolManagement.Domain.Identity;

public sealed class Role
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Name { get; init; }
    public string? Description { get; init; }
    public bool IsSystemRole { get; init; }
}
