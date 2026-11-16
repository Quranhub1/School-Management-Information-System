using Xunit;
using SchoolManagement.Application.Library;
using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Tests.Library;

public sealed class LibraryServiceTests
{
    private static readonly Guid MemberId = Guid.NewGuid();

    [Fact]
    public async Task AddBookAsync_rejects_invalid_isbn()
    {
        var repository = new FakeLibraryRepository();
        var service = new LibraryService(repository);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.AddBookAsync("9781119662680", "Book", "Author", null, 1));

        Assert.Empty(repository.Books);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task AddBookAsync_rejects_duplicate_isbn()
    {
        var repository = new FakeLibraryRepository();
        var existing = NewBook("9781119662686");
        repository.Books.Add(existing);
        var service = new LibraryService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AddBookAsync("978-1-119-66268-6", "Duplicate", "Author", null, 1));

        Assert.Single(repository.Books);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task AddBookAsync_normalizes_isbn_and_generates_bookland_barcode()
    {
        var repository = new FakeLibraryRepository();
        var service = new LibraryService(repository);

        var book = await service.AddBookAsync("978-1-119-66268-6", "  Library Book ", "  Author ", null, 2);

        Assert.Equal("9781119662686", book.Isbn);
        Assert.Equal(book.Isbn, book.BarcodeValue);
        Assert.Equal("Library Book", book.Title);
        Assert.Equal(2, book.AvailableCopies);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task GetBooksAsync_does_not_backfill_barcodes_or_write_to_database()
    {
        var repository = new FakeLibraryRepository();
        var legacyBook = NewBook("9781119662686");
        legacyBook.BarcodeValue = null;
        repository.Books.Add(legacyBook);
        var service = new LibraryService(repository);

        var books = await service.GetBooksAsync();

        Assert.Single(books);
        Assert.Null(legacyBook.BarcodeValue);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task UpdateBookAsync_rejects_total_copies_below_checked_out_inventory()
    {
        var repository = new FakeLibraryRepository();
        var book = NewBook("9781119662686");
        book.SetInventory(3, 1); // Two copies are currently on loan.
        repository.Books.Add(book);
        var service = new LibraryService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateBookAsync(book.Id, "9781119662686", "Book", "Author", null, 1));

        Assert.Equal(3, book.TotalCopies);
        Assert.Equal(1, book.AvailableCopies);
        Assert.Equal(0, repository.SaveChangesCount);
    }

    [Fact]
    public async Task IssueBookAsync_prevents_issuing_more_than_available_inventory()
    {
        var repository = new FakeLibraryRepository();
        var book = NewBook("9781119662686");
        book.SetInventory(1);
        repository.Books.Add(book);
        var service = new LibraryService(repository);
        var issuedAt = DateTime.UtcNow.AddMinutes(-1);
        var dueAt = issuedAt.AddDays(7);

        await service.IssueBookAsync(MemberId, "Student", book.Id, issuedAt, dueAt);

        Assert.Equal(0, book.AvailableCopies);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.IssueBookAsync(Guid.NewGuid(), "Student", book.Id, issuedAt, dueAt));

        Assert.Single(repository.Loans);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task ReturnBookAsync_calculates_overdue_fine_by_full_days()
    {
        var repository = new FakeLibraryRepository();
        var book = NewBook("9781119662686");
        book.SetInventory(1, 0);
        repository.Books.Add(book);
        var loan = new LibraryLoan
        {
            BookId = book.Id,
            StudentId = MemberId,
            MemberType = "Student",
            IssuedAtUtc = DateTime.UtcNow.AddDays(-10),
            DueAtUtc = DateTime.UtcNow.Date.AddDays(-2)
        };
        repository.Loans.Add(loan);
        var service = new LibraryService(repository);

        var returned = await service.ReturnBookAsync(loan.Id, 125m);

        Assert.Equal(250m, returned.FineAmount);
        Assert.NotNull(returned.ReturnedAtUtc);
        Assert.Equal(1, book.AvailableCopies);
        Assert.Equal(1, repository.SaveChangesCount);
    }

    [Fact]
    public async Task WorkflowService_rejects_empty_student_id_for_loan_history()
    {
        var service = new LibraryWorkflowService(new LibraryService(new FakeLibraryRepository()));

        await Assert.ThrowsAsync<ArgumentException>(() => service.GetStudentLoansAsync(Guid.Empty));
    }

    private static LibraryBook NewBook(string isbn)
    {
        var book = new LibraryBook { Isbn = isbn, BarcodeValue = isbn, Title = "Test Book", Author = "Test Author" };
        book.SetInventory(2);
        return book;
    }

    private sealed class FakeLibraryRepository : ILibraryRepository
    {
        public List<LibraryBook> Books { get; } = [];
        public List<LibraryLoan> Loans { get; } = [];
        public List<Librarian> Librarians { get; } = [];
        public int SaveChangesCount { get; private set; }

        public Task<LibraryBook?> GetBookAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Books.FirstOrDefault(x => x.Id == id && x.IsActive));
        public Task<LibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken cancellationToken = default) =>
            Task.FromResult(Books.FirstOrDefault(x => x.Isbn == isbn && x.IsActive));
        public Task<Librarian?> GetLibrarianAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Librarians.FirstOrDefault(x => x.Id == id));
        public Task<LibraryLoan?> GetLoanAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Loans.FirstOrDefault(x => x.Id == id));
        public Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LibraryBook>>(Books.Where(x => x.IsActive).OrderBy(x => x.Title).ToArray());
        public Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LibraryLoan>>(Loans.Where(x => x.StudentId == studentId && (!activeOnly || x.IsActive)).ToArray());
        public Task<IReadOnlyList<LibraryLoan>> GetStaffLoansAsync(Guid staffMemberId, bool activeOnly = false, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LibraryLoan>>(Loans.Where(x => x.StaffMemberId == staffMemberId && (!activeOnly || x.IsActive)).ToArray());
        public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<bool> ActiveStaffExistsAsync(Guid staffMemberId, CancellationToken cancellationToken = default) => Task.FromResult(true);
        public Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Librarian>>(Librarians.ToArray());
        public Task AddBookAsync(LibraryBook book, CancellationToken cancellationToken = default) { Books.Add(book); return Task.CompletedTask; }
        public Task AddLibrarianAsync(Librarian librarian, CancellationToken cancellationToken = default) { Librarians.Add(librarian); return Task.CompletedTask; }
        public Task AddLoanAsync(LibraryLoan loan, CancellationToken cancellationToken = default) { Loans.Add(loan); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken cancellationToken = default) { SaveChangesCount++; return Task.CompletedTask; }
        public Task<decimal> GetFinePerOverdueDayAsync(CancellationToken cancellationToken = default) => Task.FromResult(1000m);
    }
}
