namespace SchoolManagement.Domain.Communication;

public sealed class Conversation
{
    public string ConversationId { get; set; } = Guid.NewGuid().ToString();
    public string? Subject { get; set; }
    public DateTimeOffset LastMessageAt { get; set; } = DateTimeOffset.UtcNow;
    public string Participants { get; set; } = string.Empty;
}
