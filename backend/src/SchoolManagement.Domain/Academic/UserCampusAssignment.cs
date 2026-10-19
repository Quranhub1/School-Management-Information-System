namespace SchoolManagement.Domain.Academic;

/// <summary>
/// Grants a user access to records belonging to one campus.
/// A user may have multiple campuses but at most one primary campus.
/// </summary>
public sealed class UserCampusAssignment
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid UserId { get; init; }
    public Guid CampusId { get; init; }
    public bool IsPrimary { get; set; }
    public DateTimeOffset AssignedAt { get; init; } = DateTimeOffset.UtcNow;
}
