using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Staff;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class LeaveRequestRepository(SchoolManagementDbContext db) : ILeaveRequestRepository
{
    public async Task<IReadOnlyList<LeaveRequest>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default) =>
        await db.LeaveRequests.AsNoTracking().Where(x => x.StaffMemberId == staffMemberId).OrderByDescending(x => x.StartDate).ToListAsync(cancellationToken);

    public Task<LeaveRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LeaveRequests.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(LeaveRequest request, CancellationToken cancellationToken = default) => await db.LeaveRequests.AddAsync(request, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
