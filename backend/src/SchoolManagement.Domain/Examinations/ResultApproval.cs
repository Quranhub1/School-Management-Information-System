namespace SchoolManagement.Domain.Examinations;

public sealed class ResultApproval
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid ResultId { get; init; }
    public ResultApprovalStatus Status { get; private set; } = ResultApprovalStatus.Draft;
    public Guid? SubmittedByUserId { get; private set; }
    public Guid? VerifiedByUserId { get; private set; }
    public Guid? ApprovedByUserId { get; private set; }
    public Guid? PublishedByUserId { get; private set; }
    public string? RejectionReason { get; private set; }
    public DateTimeOffset? SubmittedAt { get; private set; }
    public DateTimeOffset? VerifiedAt { get; private set; }
    public DateTimeOffset? ApprovedAt { get; private set; }
    public DateTimeOffset? PublishedAt { get; private set; }
    public DateTimeOffset? RejectedAt { get; private set; }

    public void Submit(Guid actorUserId, DateTimeOffset? occurredAt = null)
    {
        EnsureActor(actorUserId);
        EnsureStatus(ResultApprovalStatus.Draft, nameof(Submit));
        Status = ResultApprovalStatus.Submitted;
        SubmittedByUserId = actorUserId;
        SubmittedAt = occurredAt ?? DateTimeOffset.UtcNow;
        RejectionReason = null;
    }

    public void Verify(Guid actorUserId, DateTimeOffset? occurredAt = null)
    {
        EnsureActor(actorUserId);
        EnsureStatus(ResultApprovalStatus.Submitted, nameof(Verify));
        Status = ResultApprovalStatus.Verified;
        VerifiedByUserId = actorUserId;
        VerifiedAt = occurredAt ?? DateTimeOffset.UtcNow;
    }

    public void Approve(Guid actorUserId, DateTimeOffset? occurredAt = null)
    {
        EnsureActor(actorUserId);
        EnsureStatus(ResultApprovalStatus.Verified, nameof(Approve));
        Status = ResultApprovalStatus.Approved;
        ApprovedByUserId = actorUserId;
        ApprovedAt = occurredAt ?? DateTimeOffset.UtcNow;
    }

    public void Reject(Guid actorUserId, string reason, DateTimeOffset? occurredAt = null)
    {
        EnsureActor(actorUserId);
        if (Status is not (ResultApprovalStatus.Submitted or ResultApprovalStatus.Verified))
            throw new InvalidOperationException($"Cannot reject results while they are {Status}.");
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("A rejection reason is required.", nameof(reason));

        Status = ResultApprovalStatus.Rejected;
        RejectionReason = reason.Trim();
        RejectedAt = occurredAt ?? DateTimeOffset.UtcNow;
    }

    public void Resubmit(Guid actorUserId, DateTimeOffset? occurredAt = null)
    {
        EnsureActor(actorUserId);
        EnsureStatus(ResultApprovalStatus.Rejected, nameof(Resubmit));
        Status = ResultApprovalStatus.Submitted;
        SubmittedByUserId = actorUserId;
        SubmittedAt = occurredAt ?? DateTimeOffset.UtcNow;
        RejectionReason = null;
        RejectedAt = null;
    }

    public void Publish(Guid actorUserId, DateTimeOffset? occurredAt = null)
    {
        EnsureActor(actorUserId);
        EnsureStatus(ResultApprovalStatus.Approved, nameof(Publish));
        Status = ResultApprovalStatus.Published;
        PublishedByUserId = actorUserId;
        PublishedAt = occurredAt ?? DateTimeOffset.UtcNow;
    }

    private void EnsureStatus(ResultApprovalStatus expected, string operation)
    {
        if (Status != expected)
            throw new InvalidOperationException($"Cannot {operation.ToLowerInvariant()} results while they are {Status}.");
    }

    private static void EnsureActor(Guid actorUserId)
    {
        if (actorUserId == Guid.Empty)
            throw new ArgumentException("A valid actor user ID is required.", nameof(actorUserId));
    }
}
