using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

public sealed class StudentChargeService(IFinanceRepository finance, FiscalPeriodService fiscalPeriods)
{
    public async Task<StudentCharge> CreateAsync(Guid studentId, string chargeType, string description, decimal amount, string currency, string? createdBy, CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("Student is required.", nameof(studentId));
        if (!await finance.StudentExistsAsync(studentId, cancellationToken)) throw new ArgumentException("Student was not found.");
        if (string.IsNullOrWhiteSpace(chargeType)) throw new ArgumentException("Charge type is required.", nameof(chargeType));
        if (string.IsNullOrWhiteSpace(description)) throw new ArgumentException("Description is required.", nameof(description));
        if (amount <= 0) throw new ArgumentOutOfRangeException(nameof(amount), "Charge amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(currency)) throw new ArgumentException("Currency is required.", nameof(currency));

        var charge = new StudentCharge
        {
            StudentId = studentId,
            ChargeType = chargeType.Trim(),
            Description = description.Trim(),
            Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero),
            Currency = currency.Trim().ToUpperInvariant(),
            Status = "Posted",
            CreatedBy = string.IsNullOrWhiteSpace(createdBy) ? null : createdBy.Trim()
        };

        var receivable = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        var revenue = await GetAccountAsync(FinanceAccountCodes.TuitionRevenue, cancellationToken);
        var entry = CreateJournalEntry(charge, receivable.Id, revenue.Id, "StudentCharge");
        await AddPostedJournalEntryAsync(entry, cancellationToken);
        await finance.AddStudentChargeAsync(charge, cancellationToken);
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = studentId,
            EntryType = "Charge",
            Description = charge.Description,
            Amount = charge.Amount,
            Currency = charge.Currency,
            Reference = $"CHG-{charge.Id:N}"
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return charge;
    }

    public async Task<IReadOnlyList<StudentCharge>> GetStudentChargesAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("Student is required.", nameof(studentId));
        if (!await finance.StudentExistsAsync(studentId, cancellationToken)) throw new ArgumentException("Student was not found.");
        return await finance.GetStudentChargesAsync(studentId, cancellationToken);
    }

    public async Task<StudentCharge> VoidAsync(Guid chargeId, string reason, string performedBy, CancellationToken cancellationToken = default)
    {
        if (chargeId == Guid.Empty) throw new ArgumentException("Charge is required.", nameof(chargeId));
        if (string.IsNullOrWhiteSpace(reason)) throw new ArgumentException("Void reason is required.", nameof(reason));
        if (string.IsNullOrWhiteSpace(performedBy)) throw new ArgumentException("Authenticated user identity is required.", nameof(performedBy));

        var charge = await finance.GetStudentChargeAsync(chargeId, cancellationToken) ?? throw new ArgumentException("Student charge was not found.");
        if (!string.Equals(charge.Status, "Posted", StringComparison.OrdinalIgnoreCase)) throw new InvalidOperationException("Only posted student charges can be voided.");

        var receivable = await GetAccountAsync(FinanceAccountCodes.StudentReceivables, cancellationToken);
        var revenue = await GetAccountAsync(FinanceAccountCodes.TuitionRevenue, cancellationToken);
        var entry = new JournalEntry
        {
            EntryNumber = $"VOID-CHG-{charge.Id:N}",
            Description = $"Void student charge {charge.Id:N}: {reason.Trim()}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = performedBy.Trim(),
            SourceType = "StudentChargeVoid",
            SourceId = charge.Id,
            Lines =
            [
                new JournalEntryLine { AccountId = revenue.Id, Description = "Reverse charge revenue", Debit = charge.Amount },
                new JournalEntryLine { AccountId = receivable.Id, Description = "Reverse student receivable", Credit = charge.Amount }
            ]
        };
        JournalEntryValidator.Validate(entry);
        await AddPostedJournalEntryAsync(entry, cancellationToken);

        charge.Status = "Voided";
        charge.VoidedAt = DateTimeOffset.UtcNow;
        charge.VoidedBy = performedBy.Trim();
        charge.VoidReason = reason.Trim();
        await finance.AddPaymentLedgerEntryAsync(new PaymentLedgerEntry
        {
            StudentId = charge.StudentId,
            EntryType = "ChargeVoid",
            Description = $"Voided charge {charge.Id:N}",
            Amount = -charge.Amount,
            Currency = charge.Currency,
            Reference = entry.EntryNumber
        }, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return charge;
    }

    private async Task<Account> GetAccountAsync(string code, CancellationToken cancellationToken) =>
        await finance.GetActiveAccountByCodeAsync(code, cancellationToken) ?? throw new InvalidOperationException($"Required finance account '{code}' is not configured.");

    private async Task AddPostedJournalEntryAsync(JournalEntry entry, CancellationToken cancellationToken)
    {
        if (await finance.JournalEntryNumberExistsAsync(entry.EntryNumber, cancellationToken)) throw new InvalidOperationException($"Journal entry number '{entry.EntryNumber}' already exists.");
        JournalEntryValidator.Validate(entry);
        await fiscalPeriods.RequireOpenPeriodAsync(DateOnly.FromDateTime(entry.EntryDate.UtcDateTime), cancellationToken);
        await finance.AddJournalEntryAsync(entry, cancellationToken);
    }

    private static JournalEntry CreateJournalEntry(StudentCharge charge, Guid receivableAccountId, Guid revenueAccountId, string sourceType) =>
        new()
        {
            EntryNumber = $"CHG-{charge.Id:N}",
            Description = $"Student charge: {charge.Description}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = charge.CreatedBy ?? "FinanceService",
            SourceType = sourceType,
            SourceId = charge.Id,
            Lines =
            [
                new JournalEntryLine { AccountId = receivableAccountId, Description = charge.Description, Debit = charge.Amount },
                new JournalEntryLine { AccountId = revenueAccountId, Description = charge.Description, Credit = charge.Amount }
            ]
        };
}
