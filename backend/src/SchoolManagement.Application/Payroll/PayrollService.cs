using SchoolManagement.Domain.Staff;

namespace SchoolManagement.Application.Payroll;

public sealed class PayrollService(IPayrollRepository payrollRepository)
{
    public async Task<IReadOnlyList<PayrollRecord>> GetByStaffAsync(Guid staffMemberId, CancellationToken cancellationToken = default) =>
        await payrollRepository.GetByStaffAsync(staffMemberId, cancellationToken);

    public async Task<IReadOnlyList<PayrollRecord>> GetByPeriodAsync(int month, int year, CancellationToken cancellationToken = default) =>
        await payrollRepository.GetByPeriodAsync(month, year, cancellationToken);

    public async Task<PayrollRecord?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await payrollRepository.GetByIdAsync(id, cancellationToken);

    public async Task<PayrollRecord> GenerateAsync(Guid staffMemberId, int month, int year, decimal basicSalary, decimal allowances, decimal deductions, CancellationToken cancellationToken = default)
    {
        var netPay = basicSalary + allowances - deductions;
        var record = new PayrollRecord
        {
            StaffMemberId = staffMemberId,
            Month = month,
            Year = year,
            BasicSalary = basicSalary,
            Allowances = allowances,
            Deductions = deductions,
            NetPay = netPay,
            Status = "Pending"
        };
        await payrollRepository.AddAsync(record, cancellationToken);
        await payrollRepository.SaveChangesAsync(cancellationToken);
        return record;
    }
}
