using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

/// <summary>
/// Central accounting integrity rules for journal entries.
/// Every entry that is posted to the General Ledger must pass these rules.
/// </summary>
public static class JournalEntryValidator
{
    public static void Validate(JournalEntry entry)
    {
        ArgumentNullException.ThrowIfNull(entry);

        if (string.IsNullOrWhiteSpace(entry.EntryNumber))
            throw new ArgumentException("Journal entry number is required.", nameof(entry));

        if (entry.Lines is null || entry.Lines.Count < 2)
            throw new InvalidOperationException("A journal entry must contain at least two lines.");

        var totalDebit = 0m;
        var totalCredit = 0m;

        foreach (var line in entry.Lines)
        {
            if (line.AccountId == Guid.Empty)
                throw new ArgumentException("Every journal line must reference an account.", nameof(entry));

            if (line.Debit < 0 || line.Credit < 0)
                throw new ArgumentException("Journal debits and credits cannot be negative.", nameof(entry));

            if (line.Debit > 0 && line.Credit > 0)
                throw new ArgumentException("A journal line cannot contain both a debit and a credit.", nameof(entry));

            if (line.Debit == 0 && line.Credit == 0)
                throw new ArgumentException("A journal line must contain a debit or a credit amount.", nameof(entry));

            totalDebit += line.Debit;
            totalCredit += line.Credit;
        }

        if (totalDebit <= 0 || totalCredit <= 0)
            throw new InvalidOperationException("A journal entry must contain a non-zero debit and credit total.");

        if (totalDebit != totalCredit)
            throw new InvalidOperationException(
                $"Journal entry '{entry.EntryNumber}' is unbalanced: debits {totalDebit:0.00} do not equal credits {totalCredit:0.00}.");

        if (string.Equals(entry.Status, "Posted", StringComparison.OrdinalIgnoreCase))
        {
            if (entry.PostedAt is null)
                throw new InvalidOperationException("A posted journal entry must have PostedAt metadata.");

            if (string.IsNullOrWhiteSpace(entry.PostedBy))
                throw new InvalidOperationException("A posted journal entry must have PostedBy metadata.");
        }
    }
}
