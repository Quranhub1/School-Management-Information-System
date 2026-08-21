using SchoolManagement.Domain.Examinations;
using Xunit;

namespace SchoolManagement.Domain.Tests.Examinations;

public sealed class ResultApprovalTests
{
    [Fact]
    public void Workflow_AllowsSubmitVerifyApproveAndPublish()
    {
        var approval = new ResultApproval { ResultId = Guid.NewGuid() };
        var lecturer = Guid.NewGuid();
        var verifier = Guid.NewGuid();
        var approver = Guid.NewGuid();
        var publisher = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        approval.Submit(lecturer, now);
        approval.Verify(verifier, now.AddMinutes(1));
        approval.Approve(approver, now.AddMinutes(2));
        approval.Publish(publisher, now.AddMinutes(3));

        Assert.Equal(ResultApprovalStatus.Published, approval.Status);
        Assert.Equal(lecturer, approval.SubmittedByUserId);
        Assert.Equal(verifier, approval.VerifiedByUserId);
        Assert.Equal(approver, approval.ApprovedByUserId);
        Assert.Equal(publisher, approval.PublishedByUserId);
        Assert.Equal(now.AddMinutes(3), approval.PublishedAt);
    }

    [Fact]
    public void Workflow_RejectsWithoutReason()
    {
        var approval = new ResultApproval { ResultId = Guid.NewGuid() };
        approval.Submit(Guid.NewGuid());

        Assert.Throws<ArgumentException>(() => approval.Reject(Guid.NewGuid(), " "));
        Assert.Equal(ResultApprovalStatus.Submitted, approval.Status);
    }

    [Fact]
    public void Workflow_AllowsResubmissionAfterRejection()
    {
        var approval = new ResultApproval { ResultId = Guid.NewGuid() };
        approval.Submit(Guid.NewGuid());
        approval.Reject(Guid.NewGuid(), "Missing examination mark");

        approval.Resubmit(Guid.NewGuid());

        Assert.Equal(ResultApprovalStatus.Submitted, approval.Status);
        Assert.Null(approval.RejectionReason);
        Assert.Null(approval.RejectedAt);
    }

    [Fact]
    public void Workflow_RejectsInvalidTransitions()
    {
        var approval = new ResultApproval { ResultId = Guid.NewGuid() };

        Assert.Throws<InvalidOperationException>(() => approval.Verify(Guid.NewGuid()));
        Assert.Throws<InvalidOperationException>(() => approval.Approve(Guid.NewGuid()));
        Assert.Throws<InvalidOperationException>(() => approval.Publish(Guid.NewGuid()));
    }

    [Fact]
    public void Workflow_RejectsPublishingBeforeApproval()
    {
        var approval = new ResultApproval { ResultId = Guid.NewGuid() };
        approval.Submit(Guid.NewGuid());
        approval.Verify(Guid.NewGuid());

        Assert.Throws<InvalidOperationException>(() => approval.Publish(Guid.NewGuid()));
        Assert.Equal(ResultApprovalStatus.Verified, approval.Status);
    }
}
