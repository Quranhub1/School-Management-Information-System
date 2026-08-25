using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.HR;

public interface IHrRepository
{
    Task<StaffMember?> GetAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StaffMember>> GetAllAsync(bool activeOnly = true, CancellationToken cancellationToken = default);
    Task<bool> ExistsByStaffNumberAsync(string staffNumber, CancellationToken cancellationToken = default);
    Task AddAsync(StaffMember staffMember, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}