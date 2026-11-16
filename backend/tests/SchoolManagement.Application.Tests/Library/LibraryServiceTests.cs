using SchoolManagement.Application.Library;
using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Tests.Library;

public sealed class LibraryServiceTests
{
    [Fact]
    public async Task AddBookAsync_ValidatesIsbnAndCreatesBookWithBarcode()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("978-0-306-40615-7", "Clean Architecture", "Robert C. Martin", null, 3);

        Assert.Equal("9780306406157", book.Isbn);
        Assert.Equal("9780306406157", book.BarcodeValue);
        Assert.Equal("Clean Architecture", book.Title);
        Assert.Equal(3, book.TotalCopies);
        Assert.Equal(3, book.AvailableCopies);
        Assert.Single(repo.Books);
    }

    [Fact]
    public async Task AddBookAsync_RejectsInvalidIsbn()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddBookAsync("not-an-isbn", "Title", "Author", null, 1));
    }

    [Fact]
    public async Task AddBookAsync_RejectsDuplicateIsbn()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        await service.AddBookAsync("9780306406157", "Book One", "Author A", null, 1);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddBookAsync("9780306406157", "Book Two", "Author B", null, 1));
    }

    [Fact]
    public async Task AddBookAsync_RejectsZeroCopies()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            service.AddBookAsync("9780306406157", "Title", "Author", null, 0));
    }

    [Fact]
    public async Task UpdateBookAsync_RejectsFewerCopiesThanCheckedOut()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 3);
        await service.IssueBookAsync(Guid.NewGuid(), "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7));
        await service.IssueBookAsync(Guid.NewGuid(), "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateBookAsync(book.Id, "9780306406157", "Title", "Author", null, 1));
    }

    [Fact]
    public async Task IssueBookAsync_DecrementsAvailableCopies()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 2);
        var memberId = Guid.NewGuid();

        var loan = await service.IssueBookAsync(memberId, "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7));

        Assert.Equal(book.Id, loan.BookId);
        Assert.Equal(memberId, loan.StudentId);
        Assert.False(loan.ReturnedAtUtc.HasValue);
        Assert.Equal(1, repo.Books[0].AvailableCopies);
    }

    [Fact]
    public async Task IssueBookAsync_RejectsWhenNoCopiesAvailable()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 1);
        var memberId = Guid.NewGuid();

        await service.IssueBookAsync(memberId, "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.IssueBookAsync(Guid.NewGuid(), "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7)));
    }

    [Fact]
    public async Task IssueBookAsync_RejectsDuplicateActiveLoanForSameMember()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 2);
        var memberId = Guid.NewGuid();

        await service.IssueBookAsync(memberId, "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7));
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.IssueBookAsync(memberId, "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7)));
    }

    [Fact]
    public async Task IssueBookAsync_RejectsInactiveBook()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 1);
        await service.ArchiveBookAsync(book.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.IssueBookAsync(Guid.NewGuid(), "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7)));
    }

    [Fact]
    public async Task ReturnBookAsync_CalculatesFineForOverdue()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 1);
        var memberId = Guid.NewGuid();
        var loan = await service.IssueBookAsync(memberId, "Student", book.Id,
            DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(-5));

        var returned = await service.ReturnBookAsync(loan.Id, finePerOverdueDay: 100m);

        Assert.NotNull(returned.ReturnedAtUtc);
        Assert.Equal(500m, returned.FineAmount); // 5 days overdue * 100
        Assert.Equal(1, repo.Books[0].AvailableCopies);
    }

    [Fact]
    public async Task ReturnBookAsync_NoFineWhenNotOverdue()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 1);
        var memberId = Guid.NewGuid();
        var loan = await service.IssueBookAsync(memberId, "Student", book.Id,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7));

        var returned = await service.ReturnBookAsync(loan.Id, finePerOverdueDay: 100m);

        Assert.Equal(0m, returned.FineAmount);
    }

    [Fact]
    public async Task ReturnBookAsync_RejectsAlreadyReturned()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 1);
        var memberId = Guid.NewGuid();
        var loan = await service.IssueBookAsync(memberId, "Student", book.Id,
            DateTime.UtcNow, DateTime.UtcNow.AddDays(7));
        await service.ReturnBookAsync(loan.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ReturnBookAsync(loan.Id));
    }

    [Fact]
    public async Task ArchiveBookAsync_RejectsWhenActiveLoansExist()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        var book = await service.AddBookAsync("9780306406157", "Title", "Author", null, 1);
        await service.IssueBookAsync(Guid.NewGuid(), "Student", book.Id, DateTime.UtcNow, DateTime.UtcNow.AddDays(7));

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ArchiveBookAsync(book.Id));
    }

    [Fact]
    public async Task GetBooksAsync_DoesNotMutateState()
    {
        var repo = new FakeLibraryRepository();
        var service = new LibraryService(repo);

        await service.AddBookAsync("notvalidisbn", "Title", "Author", null, 1);
        var books = await service.GetBooksAsync();

        Assert.Single(books);
        Assert.Null(books[0].BarcodeValue); // barcode not backfilled during read
    }

    private sealed class FakeLibraryRepository : ILibraryRepository
    {
        public List<LibraryBook> Books { get; } = [];
        public List<LibraryLoan> Loans { get; } = [];
        public List<Librarian> Librarians { get; } = [];

        public Task<LibraryBook?> GetBookAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Books.FirstOrDefault(x => x.Id == id && x.IsActive));

        public Task<LibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken cancellationToken = default) =>
            Task.FromResult(Books.FirstOrDefault(x => x.Isbn == isbn && x.IsActive));

        public Task<Librarian?> GetLibrarianAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Librarians.FirstOrDefault(x => x.Id == id));

        public Task<LibraryLoan?> GetLoanAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Loans.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LibraryBook>>(Books.Where(x => x.IsActive).OrderBy(x => x.Title).ToList());

        public Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default)
        {
            var query = Loans.Where(x => x.StudentId == studentId);
            if (activeOnly) query = query.Where(x => x.ReturnedAtUtc == null);
            return Task.FromResult<IReadOnlyList<LibraryLoan>>(query.OrderByDescending(x => x.IssuedAtUtc).ToList());
        }

        public Task<IReadOnlyList<LibraryLoan>> GetStaffLoansAsync(Guid staffMemberId, bool activeOnly = false, CancellationToken cancellationToken = default)
        {
            var query = Loans.Where(x => x.StaffMemberId == staffMemberId);
            if (activeOnly) query = query.Where(x => x.ReturnedAtUtc == null);
            return Task.FromResult<IReadOnlyList<LibraryLoan>>(query.OrderByDescending(x => x.IssuedAtUtc).ToList());
        }

        public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> ActiveStaffExistsAsync(Guid staffMemberId, CancellationToken cancellationToken = default) => Task.FromResult(true);

        public Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Librarian>>(Librarians);

        public Task AddBookAsync(LibraryBook book, CancellationToken cancellationToken = default)
        {
            Books.Add(book);
            return Task.CompletedTask;
        }

        public Task AddLibrarianAsync(Librarian librarian, CancellationToken cancellationToken = default)
        {
            Librarians.Add(librarian);
            return Task.CompletedTask;
        }

        public Task AddLoanAsync(LibraryLoan loan, CancellationToken cancellationToken = default)
        {
            Loans.Add(loan);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<decimal> GetFinePerOverdueDayAsync(CancellationToken cancellationToken = default) => Task.FromResult(1000m);
    }
}
