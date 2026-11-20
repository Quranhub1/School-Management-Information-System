namespace SchoolManagement.Domain.Identity;

/// <summary>
/// Per-user permission override. IsGranted=true explicitly grants a permission;
/// IsGranted=false explicitly denies it, even when one of the user's roles grants it.
/// </summary>
public sealed class UserPermission
{
    public Guid UserId { get; init; }
    public Guid PermissionId { get; init; }
    public bool IsGranted { get; set; }
}
