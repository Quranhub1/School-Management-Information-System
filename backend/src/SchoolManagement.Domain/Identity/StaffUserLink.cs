namespace SchoolManagement.Domain.Identity;

/// <summary>
/// Associates an authentication account with the institutional staff identity
/// it represents without coupling staff records to password credentials.
/// </summary>
public sealed class StaffUserLink
{
    public Guid StaffId { get; init; }
    public Guid UserId { get; init; }
}
