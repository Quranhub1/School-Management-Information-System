using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Asp.Versioning;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Communication;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/messages")]
[Authorize(Policy = AuthorizationPolicies.CommunicationManagement)]
public sealed class MessagesController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("conversations")]
    public async Task<ActionResult<IReadOnlyList<ConversationResponseDto>>> GetConversations(CancellationToken ct)
    {
        var conversations = await db.Conversations.AsNoTracking().OrderByDescending(x => x.LastMessageAt).ToListAsync(ct);
        return Ok(conversations.Select(ConversationResponseDto.FromDomain).ToArray());
    }

    [HttpGet("{conversationId}")]
    public async Task<ActionResult<IReadOnlyList<MessageResponseDto>>> GetMessages(string conversationId, CancellationToken ct)
        => Ok((await db.Messages.AsNoTracking().Where(x => x.ConversationId == conversationId).OrderBy(x => x.SentAt).ToListAsync(ct)).Select(MessageResponseDto.FromDomain).ToArray());

    [HttpPost("send")]
    public async Task<ActionResult<MessageResponseDto>> Send([FromBody] SendMessageRequest request, CancellationToken ct)
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
        return Created($"api/messages/{message.Id}", MessageResponseDto.FromDomain(message));
    }
}


public sealed record ConversationResponseDto(string ConversationId, string? Subject, DateTimeOffset LastMessageAt, string Participants)
{
    public static ConversationResponseDto FromDomain(Conversation conversation) =>
        new(conversation.ConversationId, conversation.Subject, conversation.LastMessageAt, conversation.Participants);
}

public sealed record MessageResponseDto(Guid Id, string ConversationId, string SenderId, string? RecipientId, string? Subject, string Body, DateTimeOffset SentAt, DateTimeOffset? ReadAt)
{
    public static MessageResponseDto FromDomain(Message message) =>
        new(message.Id, message.ConversationId, message.SenderId, message.RecipientId, message.Subject, message.Body, message.SentAt, message.ReadAt);
}

public sealed record SendMessageRequest(string ConversationId, string SenderId, string? RecipientId, string? Subject, string Body);
