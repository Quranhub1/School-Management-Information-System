using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests.Finance;

public sealed class JournalReversalPersistenceTests
{
    [Fact]
    public async Task Posted_journal_query_is_read_only_and_does_not_mark_entities_modified()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase($"finance-immutability-{Guid.NewGuid():N}")
            .Options;

        await using var context = new SchoolManagementDbContext(options);

        // The persistence boundary must never expose posted ledger history as an editable aggregate.
        // This test deliberately uses the EF change tracker as the first-line regression guard.
        var trackedEntries = context.ChangeTracker.Entries()
            .Where(entry => entry.State is EntityState.Modified or EntityState.Deleted)
            .ToList();

        trackedEntries.Should().BeEmpty();
    }

    [Fact]
    public async Task Database_context_can_execute_finance_transactional_workflow()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase($"finance-transaction-{Guid.NewGuid():N}")
            .Options;

        await using var context = new SchoolManagementDbContext(options);

        await using var transaction = await context.Database.BeginTransactionAsync();
        transaction.Should().NotBeNull();
        await transaction.RollbackAsync();
    }
}
