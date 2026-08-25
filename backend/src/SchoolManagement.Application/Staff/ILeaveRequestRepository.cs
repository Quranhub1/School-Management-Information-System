using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Staff;

public interface ILeaveRequestRepository
{
    Task<IReadOnlyList<LeaveRequest>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default);
    Task<LeaveRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(LeaveRequest request, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
