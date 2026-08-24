using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Library;

public interface ILibraryRepository
{
    Task<LibraryBook?> GetBookAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken cancellationToken = default);
    Task<Librarian?> GetLibrarianAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LibraryLoan?> GetLoanAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default);
    Task AddBookAsync(LibraryBook book, CancellationToken cancellationToken = default);
    Task AddLibrarianAsync(Librarian librarian, CancellationToken cancellationToken = default);
    Task AddLoanAsync(LibraryLoan loan, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
