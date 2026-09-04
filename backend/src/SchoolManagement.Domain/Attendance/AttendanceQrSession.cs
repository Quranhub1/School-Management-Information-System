namespace SchoolManagement.Domain.Attendance;

public sealed class AttendanceQrSession
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid AttendanceSessionId { get; init; }
    public required string QrToken { get; init; }
    public string QrSecret { get; set; } = string.Empty;
    public DateTimeOffset GeneratedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset ExpiresAt { get; init; }
    public int RotationIntervalMinutes { get; init; }
    public bool IsUsed { get; set; }
    public DateTimeOffset? UsedAt { get; set; }
    public Guid? UsedByUserId { get; set; }
}
