namespace SchoolManagement.Domain.Communication;

public sealed class Notification
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Title { get; set; }
    public required string Body { get; set; }
    public required string Channel { get; set; }
    public required string RecipientType { get; set; }
    public required string RecipientId { get; set; }
    public string? TemplateName { get; set; }
    public string? SmsGatewayConfig { get; set; }
    public string? SmtpConfig { get; set; }
    public string Status { get; set; } = "Pending";
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? SentAtUtc { get; set; }
    public string? CreatedByUserId { get; set; }
}
