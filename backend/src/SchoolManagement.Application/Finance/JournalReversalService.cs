using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Application.Finance;

/// <summary>
/// Reverses posted journal entries by creating a new, balanced journal entry.
/// The original posted entry is never edited or deleted.
/// </summary>
public sealed class JournalReversalService(IFinanceRepository finance)
{
    public async Task<JournalEntry> ReverseAsync(Guid journalEntryId, string reason, string performedBy, CancellationToken cancellationToken)
    {
        if (journalEntryId == Guid.Empty)
            throw new ArgumentException("Journal entry id is required.");
        if (string.IsNullOrWhiteSpace(reason))
            throw new ArgumentException("A reversal reason is required.");
        if (string.IsNullOrWhiteSpace(performedBy))
            throw new ArgumentException("The user performing the reversal is required.");

        var original = await finance.GetPostedJournalEntryAsync(journalEntryId, cancellationToken)
            ?? throw new ArgumentException("Posted journal entry was not found.");

        if (await finance.HasReversalAsync(original.Id, cancellationToken))
            throw new InvalidOperationException($"Journal entry '{original.EntryNumber}' has already been reversed.");

        JournalEntryValidator.Validate(original);

        var reversalNumber = $"REV-{original.EntryNumber}";
        if (await finance.JournalEntryNumberExistsAsync(reversalNumber, cancellationToken))
            throw new InvalidOperationException($"Reversal journal entry '{reversalNumber}' already exists.");

        var reversal = new JournalEntry
        {
            EntryNumber = reversalNumber,
            EntryDate = DateTimeOffset.UtcNow,
            Description = $"Reversal of {original.EntryNumber}: {reason.Trim()}",
            Status = "Posted",
            PostedAt = DateTimeOffset.UtcNow,
            PostedBy = performedBy.Trim(),
            SourceType = "JournalReversal",
            SourceId = original.Id,
            ReversalOfJournalEntryId = original.Id,
            Lines = original.Lines.Select(line => new JournalEntryLine
            {
                AccountId = line.AccountId,
                Description = $"Reversal of {original.EntryNumber}",
                Debit = line.Credit,
                Credit = line.Debit
            }).ToList()
        };

        JournalEntryValidator.Validate(reversal);
        await finance.AddJournalEntryAsync(reversal, cancellationToken);
        await finance.SaveChangesAsync(cancellationToken);
        return reversal;
    }
}
