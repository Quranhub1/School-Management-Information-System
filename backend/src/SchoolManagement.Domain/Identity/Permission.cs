namespace SchoolManagement.Domain.Identity;

public sealed class Permission
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Code { get; set; }
    public required string Name { get; set; }
    public required string GroupCode { get; set; }
    public required string GroupName { get; set; }
    public string? Description { get; set; }
}
