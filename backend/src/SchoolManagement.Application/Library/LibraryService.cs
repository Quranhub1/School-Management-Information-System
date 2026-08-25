using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Library;

public sealed class LibraryService(ILibraryRepository library)
{
    public Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default) => library.GetBooksAsync(cancellationToken);

    public Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default) => library.GetLibrariansAsync(cancellationToken);

    public Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default) =>
        library.GetStudentLoansAsync(studentId, activeOnly, cancellationToken);

    public async Task<LibraryBook> AddBookAsync(string isbn, string title, string author, string? publisher, int totalCopies, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(isbn) || string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(author))
            throw new ArgumentException("ISBN, title and author are required.");
        if (totalCopies < 1) throw new ArgumentOutOfRangeException(nameof(totalCopies));
        var normalizedIsbn = isbn.Trim();
        if (await library.GetBookByIsbnAsync(normalizedIsbn, cancellationToken) is not null)
            throw new InvalidOperationException("A library book with this ISBN already exists.");

        var book = new LibraryBook
        {
            Isbn = normalizedIsbn,
            Title = title.Trim(),
            Author = author.Trim(),
            Publisher = string.IsNullOrWhiteSpace(publisher) ? null : publisher.Trim()
        };
        book.SetInventory(totalCopies);
        await library.AddBookAsync(book, cancellationToken);
        await library.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task<Librarian> AddLibrarianAsync(Guid staffMemberId, string libraryRole, CancellationToken cancellationToken = default)
    {
        if (staffMemberId == Guid.Empty || string.IsNullOrWhiteSpace(libraryRole))
            throw new ArgumentException("Staff member and library role are required.");
        if ((await library.GetLibrariansAsync(cancellationToken)).Any(x => x.StaffMemberId == staffMemberId))
            throw new InvalidOperationException("This staff member is already registered as a librarian.");

        var librarian = new Librarian { StaffMemberId = staffMemberId, LibraryRole = libraryRole.Trim() };
        await library.AddLibrarianAsync(librarian, cancellationToken);
        await library.SaveChangesAsync(cancellationToken);
        return librarian;
    }

    public async Task<LibraryLoan> IssueBookAsync(Guid studentId, Guid bookId, DateTime dueAtUtc, CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty || bookId == Guid.Empty || dueAtUtc <= DateTime.UtcNow)
            throw new ArgumentException("Student, book and a future due date are required.");
        var book = await library.GetBookAsync(bookId, cancellationToken) ?? throw new KeyNotFoundException("Library book was not found.");
        if (!book.IsActive) throw new InvalidOperationException("This library book is inactive.");
        if (book.AvailableCopies <= 0) throw new InvalidOperationException("No available copies remain for this book.");
        if ((await library.GetStudentLoansAsync(studentId, true, cancellationToken)).Any(x => x.BookId == bookId))
            throw new InvalidOperationException("The student already has an active loan for this book.");

        var loan = new LibraryLoan { StudentId = studentId, BookId = bookId, DueAtUtc = dueAtUtc };
        book.SetInventory(book.TotalCopies, book.AvailableCopies - 1);
        await library.AddLoanAsync(loan, cancellationToken);
        await library.SaveChangesAsync(cancellationToken);
        return loan;
    }

    public async Task<LibraryLoan> ReturnBookAsync(Guid loanId, decimal finePerOverdueDay = 1000m, CancellationToken cancellationToken = default)
    {
        if (finePerOverdueDay < 0) throw new ArgumentOutOfRangeException(nameof(finePerOverdueDay));
        var loan = await library.GetLoanAsync(loanId, cancellationToken) ?? throw new KeyNotFoundException("Library loan was not found.");
        if (loan.ReturnedAtUtc.HasValue) throw new InvalidOperationException("This loan has already been returned.");
        var book = await library.GetBookAsync(loan.BookId, cancellationToken) ?? throw new KeyNotFoundException("Library book was not found.");

        var returnedAt = DateTime.UtcNow;
        var overdueDays = returnedAt.Date > loan.DueAtUtc.Date ? (returnedAt.Date - loan.DueAtUtc.Date).Days : 0;
        loan.FineAmount = overdueDays * finePerOverdueDay;
        loan.ReturnedAtUtc = returnedAt;
        book.SetInventory(book.TotalCopies, Math.Min(book.TotalCopies, book.AvailableCopies + 1));
        await library.SaveChangesAsync(cancellationToken);
        return loan;
    }
}
