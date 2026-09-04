namespace SchoolManagement.Domain.Communication;

public sealed class Message
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public string ConversationId { get; set; } = string.Empty;
    public string SenderId { get; set; } = string.Empty;
    public string? RecipientId { get; set; }
    public string? Subject { get; set; }
    public required string Body { get; set; }
    public DateTimeOffset SentAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ReadAt { get; set; }
}
