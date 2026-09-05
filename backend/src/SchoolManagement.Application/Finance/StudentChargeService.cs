using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class StudentChargeService(IFinanceRepository finance)
{
    public async Task<StudentCharge> CreateAsync(
        Guid studentId,
        string chargeType,
        string description,
        decimal amount,
        string currency,
        string? createdBy,
        CancellationToken cancellationToken)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("Student is required.", nameof(studentId));
        if (string.IsNullOrWhiteSpace(chargeType)) throw new ArgumentException("Charge type is required.", nameof(chargeType));
        if (string.IsNullOrWhiteSpace(description)) throw new ArgumentException("Description is required.", nameof(description));
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Charge amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.", nameof(currency));

        if (!await finance.StudentExistsAsync(studentId, cancellationToken))
            throw new InvalidOperationException("Student was not found.");

        var charge = new StudentCharge
        {
            StudentId = studentId,
            ChargeType = chargeType.Trim(),
            Description = description.Trim(),
            Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero),
            Currency = currency.Trim().ToUpperInvariant(),
            Status = "Pending",
            CreatedBy = createdBy
        };

        await finance.AddStudentChargeAsync(charge, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return charge;
    }
}
