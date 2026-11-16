using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Api.Controllers;
using SchoolManagement.Application.Library;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;
using Xunit;

namespace SchoolManagement.Api.Tests.Library;

public sealed class LibraryControllerTests
{
    [Fact]
    public async Task GetBookBarcode_encodes_isbn_ean_value_instead_of_book_guid()
    {
        await using var db = CreateContext();
        var book = new LibraryBook
        {
            Isbn = "9781119662686",
            BarcodeValue = "9781119662686",
            Title = "Barcode test",
            Author = "Test Author"
        };
        book.SetInventory(1);
        db.LibraryBooks.Add(book);
        await db.SaveChangesAsync();

        var controller = CreateController(db);
        var result = await controller.GetBookBarcode(book.Id, CancellationToken.None);

        var content = Assert.IsType<ContentResult>(result);
        Assert.Equal("image/svg+xml", content.ContentType);
        var svg = DecodeDataUri(content.Content!);
        Assert.Contains("9781119662686", svg);
        Assert.DoesNotContain(book.Id.ToString(), svg);
    }

    [Fact]
    public async Task GetBookBarcode_returns_not_found_for_archived_book()
    {
        await using var db = CreateContext();
        var book = new LibraryBook
        {
            Isbn = "9781119662686",
            BarcodeValue = "9781119662686",
            Title = "Archived barcode",
            Author = "Test Author"
        };
        book.SetInventory(1);
        book.Deactivate();
        db.LibraryBooks.Add(book);
        await db.SaveChangesAsync();

        var result = await CreateController(db).GetBookBarcode(book.Id, CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    private static LibraryController CreateController(SchoolManagementDbContext db)
    {
        var repository = new EmptyLibraryRepository();
        var workflow = new LibraryWorkflowService(new LibraryService(repository));
        return new LibraryController(
            workflow,
            new ConfigurationBuilder().Build(),
            db,
            null!,
            null!);
    }

    private static SchoolManagementDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new SchoolManagementDbContext(options);
    }

    private static string DecodeDataUri(string value)
    {
        const string prefix = "data:image/svg+xml;base64,";
        Assert.StartsWith(prefix, value);
        return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(value[prefix.Length..]));
    }

    private sealed class EmptyLibraryRepository : ILibraryRepository
    {
        public Task<LibraryBook?> GetBookAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<LibraryBook?>(null);
        public Task<LibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken cancellationToken = default) => Task.FromResult<LibraryBook?>(null);
        public Task<Librarian?> GetLibrarianAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<Librarian?>(null);
        public Task<LibraryLoan?> GetLoanAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<LibraryLoan?>(null);
        public Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<LibraryBook>>([]);
        public Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<LibraryLoan>>([]);
        public Task<IReadOnlyList<LibraryLoan>> GetStaffLoansAsync(Guid staffMemberId, bool activeOnly = false, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<LibraryLoan>>([]);
        public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<bool> ActiveStaffExistsAsync(Guid staffMemberId, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Librarian>>([]);
        public Task AddBookAsync(LibraryBook book, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddLibrarianAsync(Librarian librarian, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddLoanAsync(LibraryLoan loan, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
