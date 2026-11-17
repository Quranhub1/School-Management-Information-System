using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Staff;

public sealed class LeaveRequestService(ILeaveRequestRepository leaveRepository)
{
    public async Task<IReadOnlyList<LeaveRequest>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default) =>
        await leaveRepository.GetByStaffAsync(staffMemberId, cancellationToken);

    public async Task<IReadOnlyList<LeaveRequest>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await leaveRepository.GetAllAsync(cancellationToken);

    public async Task<LeaveRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await leaveRepository.GetByIdAsync(id, cancellationToken);

    public async Task<LeaveRequest> RequestAsync(
        Guid staffMemberId,
        LeaveType leaveType,
        DateOnly startDate,
        DateOnly endDate,
        string reason,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("Reason is required.", nameof(reason));
        if (startDate > endDate)
            throw new ArgumentException("Start date cannot be after end date.", nameof(startDate));
        if (startDate < DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException("Start date cannot be in the past.", nameof(startDate));
        if ((endDate.ToDateTime(TimeOnly.MinValue) - startDate.ToDateTime(TimeOnly.MinValue)).Days > 90)
            throw new ArgumentException("Leave duration cannot exceed 90 days.", nameof(endDate));

        var existing = await leaveRepository.GetByStaffAsync(staffMemberId, cancellationToken);
        var overlaps = existing.Any(x =>
            x.Status != LeaveRequestStatus.Rejected &&
            x.Status != LeaveRequestStatus.Cancelled &&
            startDate <= x.EndDate &&
            endDate >= x.StartDate);
        if (overlaps)
            throw new InvalidOperationException("This leave period overlaps with an existing request.");

        var request = new LeaveRequest
        {
            StaffMemberId = staffMemberId,
            LeaveType = leaveType,
            StartDate = startDate,
            EndDate = endDate,
            Reason = reason.Trim(),
            Status = LeaveRequestStatus.Pending
        };

        await leaveRepository.AddAsync(request, cancellationToken);
        await leaveRepository.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task<LeaveRequest?> ApproveAsync(
        Guid id,
        Guid? approvedBy,
        bool approved,
        CancellationToken cancellationToken = default)
    {
        var request = await leaveRepository.GetByIdAsync(id, cancellationToken);
        if (request is null) return null;
        if (request.Status != LeaveRequestStatus.Pending)
            throw new InvalidOperationException($"Leave request is already {request.Status}.");

        request.Status = approved ? LeaveRequestStatus.Approved : LeaveRequestStatus.Rejected;
        request.ApprovedBy = approvedBy;
        request.ApprovedAt = DateTimeOffset.UtcNow;
        await leaveRepository.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task<LeaveRequest?> CancelAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var request = await leaveRepository.GetByIdAsync(id, cancellationToken);
        if (request is null) return null;
        if (request.Status != LeaveRequestStatus.Pending)
            throw new InvalidOperationException($"Only pending leave requests can be cancelled. Current status: {request.Status}.");

        request.Status = LeaveRequestStatus.Cancelled;
        await leaveRepository.SaveChangesAsync(cancellationToken);
        return request;
    }
}
