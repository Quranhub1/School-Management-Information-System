namespace SchoolManagement.Domain.Calendar;

public sealed class CalendarEvent
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string Title { get; init; } = string.Empty;
    public string? Description { get; set; }
    public string EventType { get; init; } = string.Empty;
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public string? Location { get; set; }
    public bool IsActive { get; set; } = true;
}
