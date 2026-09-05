using SchoolManagement.Application.Finance;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Tests.Finance;

public sealed class JournalEntryValidatorTests
{
    [Fact]
    public void Validate_accepts_balanced_posted_entry()
    {
        var entry = CreateEntry(100m, 100m);

        JournalEntryValidator.Validate(entry);
    }

    [Fact]
    public void Validate_rejects_unbalanced_entry()
    {
        var entry = CreateEntry(100m, 90m);

        var exception = Assert.Throws<InvalidOperationException>(() => JournalEntryValidator.Validate(entry));

        Assert.Contains("unbalanced", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Validate_rejects_line_with_both_debit_and_credit()
    {
        var entry = CreateEntry(100m, 100m);
        entry.Lines.First().Debit = 100m;
        entry.Lines.First().Credit = 1m;

        Assert.Throws<ArgumentException>(() => JournalEntryValidator.Validate(entry));
    }

    [Fact]
    public void Validate_rejects_zero_value_line()
    {
        var entry = CreateEntry(100m, 100m);
        entry.Lines.First().Debit = 0m;
        entry.Lines.First().Credit = 0m;

        Assert.Throws<ArgumentException>(() => JournalEntryValidator.Validate(entry));
    }

    [Fact]
    public void Validate_requires_posted_metadata_for_posted_entry()
    {
        var entry = CreateEntry(100m, 100m);
        entry.PostedBy = null;

        Assert.Throws<InvalidOperationException>(() => JournalEntryValidator.Validate(entry));
    }

    private static JournalEntry CreateEntry(decimal debit, decimal credit) => new()
    {
        EntryNumber = "TEST-001",
        Status = "Posted",
        PostedAt = DateTimeOffset.UtcNow,
        PostedBy = "Test",
        Lines =
        [
            new JournalEntryLine
            {
                AccountId = Guid.NewGuid(),
                Debit = debit,
                Credit = 0
            },
            new JournalEntryLine
            {
                AccountId = Guid.NewGuid(),
                Debit = 0,
                Credit = credit
            }
        ]
    };
}
