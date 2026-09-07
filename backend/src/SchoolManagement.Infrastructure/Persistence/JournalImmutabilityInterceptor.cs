using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Infrastructure.Persistence;

/// <summary>
/// Protects posted journals from mutation or deletion at the EF Core persistence boundary.
/// Corrections must be made through a new journal (normally a reversal/adjustment), never by
/// rewriting the historical posted entry.
/// </summary>
public sealed class JournalImmutabilityInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Validate(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Validate(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void Validate(DbContext? context)
    {
        if (context is null) return;

        foreach (var entry in context.ChangeTracker.Entries<JournalEntry>())
        {
            var isMutation = entry.State is EntityState.Modified or EntityState.Deleted;
            var wasPosted = string.Equals(entry.OriginalValues[nameof(JournalEntry.Status)]?.ToString(), "Posted", StringComparison.OrdinalIgnoreCase);
            if (isMutation && wasPosted)
                throw new InvalidOperationException("Posted journal entries are immutable. Create a reversal or adjustment journal instead.");
        }

        foreach (var entry in context.ChangeTracker.Entries<JournalEntryLine>())
        {
            if (entry.State is not (EntityState.Modified or EntityState.Deleted)) continue;

            var journalId = entry.Property(x => x.JournalEntryId).OriginalValue;
            var journal = context.Set<JournalEntry>().Local.FirstOrDefault(x => x.Id == journalId);
            if (journal is not null && string.Equals(journal.Status, "Posted", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("Lines belonging to a posted journal entry are immutable.");

            if (journal is null && context.Set<JournalEntry>().AsNoTracking().Any(x => x.Id == journalId && x.Status == "Posted"))
                throw new InvalidOperationException("Lines belonging to a posted journal entry are immutable.");
        }
    }
}
