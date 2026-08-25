using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.HR;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class HrRepository(SchoolManagementDbContext db) : IHrRepository
{
    public Task<StaffMember?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.StaffMembers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<StaffMember>> GetAllAsync(
        bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var query = db.StaffMembers.AsNoTracking();
        if (activeOnly)
            query = query.Where(x => x.IsActive);

        return await query
            .OrderBy(x => x.LastName)
            .ThenBy(x => x.FirstName)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsByStaffNumberAsync(
        string staffNumber,
        CancellationToken cancellationToken = default) =>
        db.StaffMembers.AnyAsync(x => x.StaffNumber == staffNumber, cancellationToken);

    public Task AddAsync(StaffMember staffMember, CancellationToken cancellationToken = default) =>
        db.StaffMembers.AddAsync(staffMember, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}