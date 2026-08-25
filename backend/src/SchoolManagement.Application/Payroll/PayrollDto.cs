namespace SchoolManagement.Application.Payroll;

public sealed record PayrollRecordDto(
    Guid Id,
    Guid StaffMemberId,
    int Month,
    int Year,
    decimal BasicSalary,
    decimal Allowances,
    decimal Deductions,
    decimal NetPay,
    DateTimeOffset? PaymentDate,
    string Status);

public sealed record GeneratePayrollRequest(int Month, int Year);
