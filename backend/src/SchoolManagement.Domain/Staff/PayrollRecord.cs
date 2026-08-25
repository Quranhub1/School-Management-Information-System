namespace SchoolManagement.Domain.Staff;

public sealed class PayrollRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid StaffMemberId { get; init; }
    public int Month { get; init; }
    public int Year { get; init; }
    public decimal BasicSalary { get; init; }
    public decimal Allowances { get; init; }
    public decimal Deductions { get; init; }
    public decimal NetPay { get; init; }
    public DateTimeOffset? PaymentDate { get; set; }
    public string Status { get; set; } = "Pending";
}
