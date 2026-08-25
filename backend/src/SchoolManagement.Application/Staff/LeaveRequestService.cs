using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Staff;

public sealed class LeaveRequestService(ILeaveRequestRepository leaveRepository)
{
    public async Task<IReadOnlyList<LeaveRequest>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default) =>
        await leaveRepository.GetByStaffAsync(staffMemberId, cancellationToken);

    public async Task<LeaveRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await leaveRepository.GetByIdAsync(id, cancellationToken);

    public async Task<LeaveRequest> RequestAsync(Guid staffMemberId, string leaveType, DateOnly startDate, DateOnly endDate, string reason, CancellationToken cancellationToken = default)
    {
        var request = new LeaveRequest
        {
            StaffMemberId = staffMemberId,
            LeaveType = leaveType,
            StartDate = startDate,
            EndDate = endDate,
            Reason = reason,
            Status = "Pending"
        };
        await leaveRepository.AddAsync(request, cancellationToken);
        await leaveRepository.SaveChangesAsync(cancellationToken);
        return request;
    }

    public async Task<LeaveRequest?> ApproveAsync(Guid id, Guid approvedBy, bool approved, CancellationToken cancellationToken = default)
    {
        var request = await leaveRepository.GetByIdAsync(id, cancellationToken);
        if (request is null) return null;
        request.Status = approved ? "Approved" : "Rejected";
        request.ApprovedBy = approvedBy;
        request.ApprovedAt = DateTimeOffset.UtcNow;
        await leaveRepository.SaveChangesAsync(cancellationToken);
        return request;
    }
}
