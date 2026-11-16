using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Library;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Repositories;

namespace SchoolManagement.Infrastructure.Tests.Library;

public sealed class LibraryRepositoryTests
{
    [Fact]
    public async Task GetBooksAsync_returns_only_active_books_in_title_order()
    {
        await using var db = CreateContext();
        var zulu = NewBook("9781119662686", "Zulu");
        var alpha = NewBook("9780306406157", "Alpha");
        var archived = NewBook("9780131103627", "Archived");
        archived.Deactivate();
        db.LibraryBooks.AddRange(zulu, alpha, archived);
        await db.SaveChangesAsync();

        var repository = new LibraryRepository(db);
        var books = await repository.GetBooksAsync();

        Assert.Equal(new[] { "Alpha", "Zulu" }, books.Select(x => x.Title));
    }

    [Fact]
    public async Task GetBookAsync_does_not_return_archived_book()
    {
        await using var db = CreateContext();
        var book = NewBook("9781119662686", "Archived");
        book.Deactivate();
        db.LibraryBooks.Add(book);
        await db.SaveChangesAsync();

        var result = await new LibraryRepository(db).GetBookAsync(book.Id);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetStudentLoansAsync_can_filter_to_active_loans()
    {
        await using var db = CreateContext();
        var book = NewBook("9781119662686", "Circulation");
        var studentId = Guid.NewGuid();
        var active = new LibraryLoan
        {
            BookId = book.Id,
            StudentId = studentId,
            MemberType = "Student",
            IssuedAtUtc = DateTime.UtcNow.AddDays(-1),
            DueAtUtc = DateTime.UtcNow.AddDays(7)
        };
        var returned = new LibraryLoan
        {
            BookId = book.Id,
            StudentId = studentId,
            MemberType = "Student",
            IssuedAtUtc = DateTime.UtcNow.AddDays(-10),
            DueAtUtc = DateTime.UtcNow.AddDays(-3),
            ReturnedAtUtc = DateTime.UtcNow.AddDays(-2)
        };
        db.LibraryBooks.Add(book);
        db.LibraryLoans.AddRange(active, returned);
        await db.SaveChangesAsync();

        var repository = new LibraryRepository(db);
        var activeLoans = await repository.GetStudentLoansAsync(studentId, activeOnly: true);
        var allLoans = await repository.GetStudentLoansAsync(studentId);

        Assert.Single(activeLoans);
        Assert.Equal(active.Id, activeLoans[0].Id);
        Assert.Equal(2, allLoans.Count);
    }

    [Fact]
    public async Task GetLoanAsync_preserves_historical_loan_even_if_book_is_archived()
    {
        await using var db = CreateContext();
        var book = NewBook("9781119662686", "Archived after issue");
        book.Deactivate();
        var loan = new LibraryLoan
        {
            BookId = book.Id,
            StudentId = Guid.NewGuid(),
            MemberType = "Student",
            IssuedAtUtc = DateTime.UtcNow.AddDays(-2),
            DueAtUtc = DateTime.UtcNow.AddDays(5)
        };
        db.LibraryBooks.Add(book);
        db.LibraryLoans.Add(loan);
        await db.SaveChangesAsync();

        var result = await new LibraryRepository(db).GetLoanAsync(loan.Id);

        Assert.NotNull(result);
        Assert.Equal(loan.Id, result!.Id);
    }

    private static SchoolManagementDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new SchoolManagementDbContext(options);
    }

    private static LibraryBook NewBook(string isbn, string title)
    {
        var book = new LibraryBook { Isbn = isbn, BarcodeValue = isbn, Title = title, Author = "Test Author" };
        book.SetInventory(2);
        return book;
    }
}
