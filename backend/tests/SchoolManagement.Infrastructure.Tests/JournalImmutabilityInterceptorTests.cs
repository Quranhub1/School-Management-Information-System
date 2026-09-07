using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests;

public sealed class JournalImmutabilityInterceptorTests
{
    [Fact]
    public async Task AddingLineToPostedJournalIsRejected()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase($"journal-immutability-{Guid.NewGuid()}")
            .AddInterceptors(new JournalImmutabilityInterceptor())
            .Options;

        var journalId = Guid.NewGuid();
        await using (var setup = new SchoolManagementDbContext(options))
        {
            setup.JournalEntries.Add(new JournalEntry
            {
                Id = journalId,
                EntryNumber = "POSTED-IMMUTABILITY-001",
                Status = "Posted",
                PostedAt = DateTimeOffset.UtcNow,
                PostedBy = "test"
            });
            await setup.SaveChangesAsync();
        }

        await using var context = new SchoolManagementDbContext(options);
        context.JournalEntryLines.Add(new JournalEntryLine
        {
            JournalEntryId = journalId,
            AccountId = Guid.NewGuid(),
            Debit = 100m
        });

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => context.SaveChangesAsync());
        Assert.Contains("posted journal", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task AddingLineToDraftJournalRemainsAllowed()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase($"journal-immutability-{Guid.NewGuid()}")
            .AddInterceptors(new JournalImmutabilityInterceptor())
            .Options;

        var journalId = Guid.NewGuid();
        await using var context = new SchoolManagementDbContext(options);
        context.JournalEntries.Add(new JournalEntry
        {
            Id = journalId,
            EntryNumber = "DRAFT-IMMUTABILITY-001",
            Status = "Draft"
        });
        await context.SaveChangesAsync();

        context.JournalEntryLines.Add(new JournalEntryLine
        {
            JournalEntryId = journalId,
            AccountId = Guid.NewGuid(),
            Credit = 100m
        });

        await context.SaveChangesAsync();
        Assert.Single(await context.JournalEntryLines.ToListAsync());
    }
}
