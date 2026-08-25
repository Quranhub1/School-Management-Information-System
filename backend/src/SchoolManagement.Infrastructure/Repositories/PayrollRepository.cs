using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Payroll;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class PayrollRepository(SchoolManagementDbContext db) : IPayrollRepository
{
    public async Task<IReadOnlyList<PayrollRecord>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default) =>
        await db.PayrollRecords.AsNoTracking().Where(x => x.StaffMemberId == staffMemberId).OrderByDescending(x => x.Year).ThenByDescending(x => x.Month).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<PayrollRecord>> GetByPeriodAsync(int month, int year, CancellationToken cancellationToken = default) =>
        await db.PayrollRecords.AsNoTracking().Where(x => x.Month == month && x.Year == year).OrderBy(x => x.StaffMemberId).ToListAsync(cancellationToken);

    public Task<PayrollRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.PayrollRecords.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(PayrollRecord record, CancellationToken cancellationToken = default) => await db.PayrollRecords.AddAsync(record, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
