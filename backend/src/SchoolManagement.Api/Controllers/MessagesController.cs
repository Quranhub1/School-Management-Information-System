using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize(Policy = AuthorizationPolicies.CommunicationManagement)]
public sealed class MessagesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("conversations")]
    public async Task<ActionResult<IReadOnlyList<Conversation>>> GetConversations(CancellationToken ct)
    {
        var conversations = await db.Conversations.AsNoTracking().OrderByDescending(x => x.LastMessageAt).ToListAsync(ct);
        return Ok(conversations);
    }

    [HttpGet("{conversationId}")]
    public async Task<ActionResult<IReadOnlyList<Message>>> GetMessages(string conversationId, CancellationToken ct)
        => Ok(await db.Messages.AsNoTracking().Where(x => x.ConversationId == conversationId).OrderBy(x => x.SentAt).ToListAsync(ct));

    [HttpPost("send")]
    public async Task<ActionResult<Message>> Send([FromBody] SendMessageRequest request, CancellationToken ct)
    {
        var message = new Message
        {
            ConversationId = request.ConversationId,
            SenderId = request.SenderId,
            RecipientId = request.RecipientId,
            Subject = request.Subject,
            Body = request.Body.Trim()
        };
        db.Messages.Add(message);
        var conversation = await db.Conversations.SingleOrDefaultAsync(x => x.ConversationId == request.ConversationId, ct);
        if (conversation is null)
        {
            conversation = new Conversation { ConversationId = request.ConversationId, Subject = request.Subject, LastMessageAt = message.SentAt };
            db.Conversations.Add(conversation);
        }
        else
        {
            conversation.LastMessageAt = message.SentAt;
        }
        await db.SaveChangesAsync(ct);
        return Created($"api/messages/{message.Id}", message);
    }
}

public sealed record SendMessageRequest(string ConversationId, string SenderId, string? RecipientId, string? Subject, string Body);
