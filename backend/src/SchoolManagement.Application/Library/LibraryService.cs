using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Library;

public sealed class LibraryService(ILibraryRepository library)
{
    public Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default) =>
        library.GetBooksAsync(cancellationToken);

    public Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default) => library.GetLibrariansAsync(cancellationToken);

    public Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default) =>
        library.GetStudentLoansAsync(studentId, activeOnly, cancellationToken);

    public async Task<LibraryBook> AddBookAsync(string isbn, string title, string author, string? publisher, int totalCopies, CancellationToken cancellationToken = default)
    {
        var normalizedIsbn = NormalizeAndValidateIsbn(isbn);
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(author))
            throw new ArgumentException("ISBN, title and author are required.");
        if (totalCopies < 1) throw new ArgumentOutOfRangeException(nameof(totalCopies));
        if (await library.GetBookByIsbnAsync(normalizedIsbn, cancellationToken) is not null)
            throw new InvalidOperationException("A library book with this ISBN already exists.");

        var book = new LibraryBook
        {
            Isbn = normalizedIsbn,
            BarcodeValue = ToBooklandEan13(normalizedIsbn),
            Title = title.Trim(),
            Author = author.Trim(),
            Publisher = string.IsNullOrWhiteSpace(publisher) ? null : publisher.Trim()
        };
        book.SetInventory(totalCopies);
        await library.AddBookAsync(book, cancellationToken);
        await library.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task<LibraryBook> UpdateBookAsync(Guid id, string isbn, string title, string author, string? publisher, int totalCopies, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty) throw new ArgumentException("A valid book id is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(title) || string.IsNullOrWhiteSpace(author))
            throw new ArgumentException("Title and author are required.");
        if (totalCopies < 1) throw new ArgumentOutOfRangeException(nameof(totalCopies));

        var book = await library.GetBookAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("The catalogue book was not found.");
        var normalizedIsbn = NormalizeAndValidateIsbn(isbn);
        var duplicate = await library.GetBookByIsbnAsync(normalizedIsbn, cancellationToken);
        if (duplicate is not null && duplicate.Id != id)
            throw new InvalidOperationException("Another catalogue book already uses this ISBN.");

        var checkedOutCopies = book.TotalCopies - book.AvailableCopies;
        if (totalCopies < checkedOutCopies)
            throw new InvalidOperationException($"Total copies cannot be lower than the {checkedOutCopies} copies currently on loan.");

        book.Isbn = normalizedIsbn;
        book.BarcodeValue = ToBooklandEan13(normalizedIsbn);
        book.Title = title.Trim();
        book.Author = author.Trim();
        book.Publisher = string.IsNullOrWhiteSpace(publisher) ? null : publisher.Trim();
        book.SetInventory(totalCopies, totalCopies - checkedOutCopies);
        await library.SaveChangesAsync(cancellationToken);
        return book;
    }

    public async Task ArchiveBookAsync(Guid id, CancellationToken cancellationToken = default)
    {
        if (id == Guid.Empty) throw new ArgumentException("A valid book id is required.", nameof(id));
        var book = await library.GetBookAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException("The catalogue book was not found.");
        book.Deactivate();
        await library.SaveChangesAsync(cancellationToken);
    }

    private static string NormalizeAndValidateIsbn(string value)
    {
        var isbn = new string((value ?? string.Empty).ToUpperInvariant().Where(char.IsAsciiLetterOrDigit).ToArray());
        if (isbn.Length == 13 && isbn.All(char.IsAsciiDigit))
        {
            var sum = isbn.Take(12).Select((c, i) => (c - '0') * (i % 2 == 0 ? 1 : 3)).Sum();
            if ((10 - sum % 10) % 10 == isbn[12] - '0') return isbn;
        }
        if (isbn.Length == 10 && isbn.Take(9).All(char.IsAsciiDigit) && (char.IsAsciiDigit(isbn[9]) || isbn[9] == 'X'))
        {
            var sum = isbn.Select((c, i) => (c == 'X' ? 10 : c - '0') * (10 - i)).Sum();
            if (sum % 11 == 0) return isbn;
        }
        throw new ArgumentException("Enter a valid ISBN-10 or ISBN-13 with its correct check digit.");
    }

    public static string ToBooklandEan13(string isbn)
    {
        if (isbn.Length == 13) return isbn;
        var body = "978" + isbn[..9];
        var sum = body.Select((c, i) => (c - '0') * (i % 2 == 0 ? 1 : 3)).Sum();
        return body + ((10 - sum % 10) % 10).ToString();
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

    public async Task<LibraryLoan> IssueBookAsync(Guid memberId, string memberType, Guid bookId, DateTime issuedAtUtc, DateTime dueAtUtc, CancellationToken cancellationToken = default)
    {
        var type = (memberType ?? string.Empty).Trim();
        if (memberId == Guid.Empty || bookId == Guid.Empty || (type != "Student" && type != "Staff")) throw new ArgumentException("Select a valid Student or Staff member and a book.");
        if (issuedAtUtc.Kind == DateTimeKind.Unspecified) issuedAtUtc = DateTime.SpecifyKind(issuedAtUtc, DateTimeKind.Utc);
        if (dueAtUtc.Kind == DateTimeKind.Unspecified) dueAtUtc = DateTime.SpecifyKind(dueAtUtc, DateTimeKind.Utc);
        if (issuedAtUtc > DateTime.UtcNow.AddMinutes(5) || dueAtUtc <= issuedAtUtc) throw new ArgumentException("Issue date cannot be in the future and due date must be after issue date.");
        if (type == "Student" && !await library.StudentExistsAsync(memberId, cancellationToken)) throw new KeyNotFoundException("Student was not found in the central student register.");
        if (type == "Staff" && !await library.ActiveStaffExistsAsync(memberId, cancellationToken)) throw new KeyNotFoundException("Active staff member was not found in the staff register.");
        var book = await library.GetBookAsync(bookId, cancellationToken) ?? throw new KeyNotFoundException("Library book was not found.");
        if (!book.IsActive) throw new InvalidOperationException("This library book is inactive.");
        if (book.AvailableCopies <= 0) throw new InvalidOperationException("No available copies remain for this book.");
        var memberLoans = type == "Student" ? await library.GetStudentLoansAsync(memberId, true, cancellationToken) : await library.GetStaffLoansAsync(memberId, true, cancellationToken);
        if (memberLoans.Any(x => x.BookId == bookId)) throw new InvalidOperationException("This member already has an active loan for this book.");
        var loan = new LibraryLoan { StudentId = type == "Student" ? memberId : null, StaffMemberId = type == "Staff" ? memberId : null, MemberType = type, BookId = bookId, IssuedAtUtc = issuedAtUtc, DueAtUtc = dueAtUtc };
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
