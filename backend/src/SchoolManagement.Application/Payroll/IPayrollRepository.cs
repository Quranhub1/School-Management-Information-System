using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Payroll;

public interface IPayrollRepository
{
    Task<IReadOnlyList<PayrollRecord>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PayrollRecord>> GetByPeriodAsync(int month, int year, CancellationToken cancellationToken = default);
    Task<PayrollRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(PayrollRecord record, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
