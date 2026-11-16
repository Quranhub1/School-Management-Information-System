using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests.Library;

public sealed class LibraryPostgreSqlConcurrencyTests
{
    [Fact]
    public async Task Concurrent_inventory_updates_allow_only_one_writer()
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SchoolManagement");
        if (string.IsNullOrWhiteSpace(connectionString))
            return; // The full-system CI job supplies its disposable PostgreSQL database.

        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseNpgsql(connectionString)
            .Options;
        var book = NewBookWithUniqueIsbn();
        try
        {
            await using (var setup = new SchoolManagementDbContext(options))
            {
                setup.LibraryBooks.Add(book);
                await setup.SaveChangesAsync();
            }

            await using var firstWriter = new SchoolManagementDbContext(options);
            await using var secondWriter = new SchoolManagementDbContext(options);
            var firstCopy = await firstWriter.LibraryBooks.SingleAsync(x => x.Id == book.Id);
            var secondCopy = await secondWriter.LibraryBooks.SingleAsync(x => x.Id == book.Id);

            firstCopy.SetInventory(2, 1);
            secondCopy.SetInventory(2, 0);

            await firstWriter.SaveChangesAsync();

            await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => secondWriter.SaveChangesAsync());

            await using var verify = new SchoolManagementDbContext(options);
            var stored = await verify.LibraryBooks.SingleAsync(x => x.Id == book.Id);
            Assert.Equal(1, stored.AvailableCopies);
        }
        finally
        {
            await using var cleanup = new SchoolManagementDbContext(options);
            var stored = await cleanup.LibraryBooks.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == book.Id);
            if (stored is not null)
            {
                cleanup.LibraryBooks.Remove(stored);
                await cleanup.SaveChangesAsync();
            }
        }
    }

    private static LibraryBook NewBookWithUniqueIsbn()
    {
        var body = "978" + Random.Shared.Next(100_000_000, 999_999_999).ToString();
        var sum = body.Select((character, index) =>
            (character - '0') * (index % 2 == 0 ? 1 : 3)).Sum();
        var isbn = body + ((10 - sum % 10) % 10).ToString();
        var book = new LibraryBook
        {
            Isbn = isbn,
            BarcodeValue = isbn,
            Title = "Concurrency integration test",
            Author = "SMIS automated test"
        };
        book.SetInventory(2);
        return book;
    }
}
