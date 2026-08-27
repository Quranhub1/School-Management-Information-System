namespace SchoolManagement.Domain.Calendar;

public sealed class CalendarReminder
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CalendarEventId { get; init; }
    public string RecipientType { get; set; } = "All";
    public string? RecipientId { get; set; }
    public string? Message { get; set; }
    public DateOnly RemindOnUtc { get; set; }
    public string Channel { get; set; } = "InApp";
    public bool IsSent { get; set; }
    public DateTimeOffset? SentAtUtc { get; set; }
    public DateTimeOffset CreatedAtUtc { get; init; } = DateTimeOffset.UtcNow;
}
