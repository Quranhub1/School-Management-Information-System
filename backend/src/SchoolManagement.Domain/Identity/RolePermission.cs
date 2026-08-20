namespace SchoolManagement.Domain.Identity;

public sealed class RolePermission
{
    public Guid RoleId { get; init; }
    public Guid PermissionId { get; init; }
}
