namespace SchoolManagement.Domain.Hostel;

/// <summary>
/// A durable School Warden operational record. Categories are CheckIn, CheckOut,
/// Inspection, Maintenance, or Indiscipline. These records are independent of bed
/// allocation so the Warden workflow does not expose room/bed administration.
/// </summary>
public sealed class WardenRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Category { get; set; }
    public required string Subject { get; set; }
    public string? StudentName { get; set; }
    public string? StudentReference { get; set; }
    public required string Details { get; set; }
    public string Status { get; set; } = "Open";
    public string? ActionTaken { get; set; }
    public DateTimeOffset RecordedAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ClosedAtUtc { get; set; }
    public required string RecordedBy { get; set; }
}
