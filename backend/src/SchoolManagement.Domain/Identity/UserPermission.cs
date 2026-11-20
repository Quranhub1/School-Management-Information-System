namespace SchoolManagement.Domain.Identity;

/// <summary>Explicit per-user grants supplement permissions inherited from assigned roles.</summary>
public sealed class UserPermission
{
    public Guid UserId { get; init; }
    public Guid PermissionId { get; init; }
}
