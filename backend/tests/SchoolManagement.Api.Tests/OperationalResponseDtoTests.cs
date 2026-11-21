using SchoolManagement.Api.Controllers;
using SchoolManagement.Domain.Access;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Domain.Calendar;
using SchoolManagement.Domain.Communication;
using Xunit;

namespace SchoolManagement.Api.Tests;

public sealed class OperationalResponseDtoTests
{
    [Fact]
    public void Calendar_event_response_DTO_maps_all_public_fields()
    {
        var entity = new CalendarEvent
        {
            Title = "Semester opening",
            Description = "Opening day",
            EventType = "Academic",
            StartDate = new DateOnly(2026, 12, 1),
            EndDate = new DateOnly(2026, 12, 1),
            Location = "Main campus",
            IsActive = true
        };

        var response = CalendarEventResponseDto.FromDomain(entity);

        Assert.Equal(entity.Id, response.Id);
        Assert.Equal(entity.Title, response.Title);
        Assert.Equal(entity.Location, response.Location);
    }

    [Fact]
    public void Conversation_and_message_response_DTOs_map_message_content_and_timestamps()
    {
        var conversation = new Conversation
        {
            ConversationId = "conversation-1",
            Subject = "Staff notice",
            LastMessageAt = DateTimeOffset.UtcNow,
            Participants = "user-1,user-2"
        };
        var message = new Message
        {
            ConversationId = conversation.ConversationId,
            SenderId = "user-1",
            RecipientId = "user-2",
            Subject = "Staff notice",
            Body = "Meeting at 10:00"
        };

        var conversationResponse = ConversationResponseDto.FromDomain(conversation);
        var messageResponse = MessageResponseDto.FromDomain(message);

        Assert.Equal(conversation.Participants, conversationResponse.Participants);
        Assert.Equal(message.Id, messageResponse.Id);
        Assert.Equal(message.Body, messageResponse.Body);
        Assert.Equal(message.RecipientId, messageResponse.RecipientId);
    }

    [Fact]
    public void Gate_log_response_DTO_maps_entry_and_exit_audit_fields()
    {
        var entity = new GateLog
        {
            PersonName = "Visitor",
            PersonType = "Visitor",
            Purpose = "Meeting",
            EntryTime = DateTimeOffset.UtcNow,
            ExitTime = DateTimeOffset.UtcNow.AddHours(1),
            IssuedBy = Guid.NewGuid(),
            Notes = "Reception checked"
        };

        var response = GateLogResponseDto.FromDomain(entity);

        Assert.Equal(entity.Id, response.Id);
        Assert.Equal(entity.EntryTime, response.EntryTime);
        Assert.Equal(entity.ExitTime, response.ExitTime);
        Assert.Equal(entity.IssuedBy, response.IssuedBy);
    }

    [Fact]
    public void Assessment_response_DTOs_map_plan_and_finalization_state()
    {
        var plan = new AssessmentPlan
        {
            CourseId = Guid.NewGuid(),
            Name = "Mid-semester",
            AssessmentType = "Written",
            WeightPercentage = 40m,
            IsCompetencyBased = false
        };
        var assessment = new StudentAssessment
        {
            StudentId = Guid.NewGuid(),
            CourseRegistrationId = Guid.NewGuid(),
            AssessmentPlanId = plan.Id,
            Score = 35m,
            MaximumScore = 40m,
            Grade = "A",
            IsFinalized = true
        };

        var planResponse = AssessmentsController.AssessmentPlanResponseDto.FromDomain(plan);
        var assessmentResponse = AssessmentsController.StudentAssessmentResponseDto.FromDomain(assessment);

        Assert.Equal(plan.CourseId, planResponse.CourseId);
        Assert.Equal(plan.WeightPercentage, planResponse.WeightPercentage);
        Assert.True(assessmentResponse.IsFinalized);
        Assert.True(assessmentResponse.IsFinal);
        Assert.Equal(assessment.Score, assessmentResponse.Score);
    }
}
