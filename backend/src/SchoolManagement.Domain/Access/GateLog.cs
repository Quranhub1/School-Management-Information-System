namespace SchoolManagement.Domain.Access;

public sealed class GateLog
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string PersonName { get; init; } = string.Empty;
    public string PersonType { get; init; } = string.Empty;
    public string Purpose { get; init; } = string.Empty;
    public DateTimeOffset EntryTime { get; init; }
    public DateTimeOffset? ExitTime { get; set; }
    public Guid? IssuedBy { get; set; }
    public string? Notes { get; set; }
}
