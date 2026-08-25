using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Library;

public sealed class LibraryWorkflowService(LibraryService library)
{
    public async Task<IReadOnlyList<LibraryBookDto>> GetBooksAsync(CancellationToken cancellationToken = default) =>
        (await library.GetBooksAsync(cancellationToken)).Select(LibraryBookDto.FromDomain).ToArray();

    public async Task<IReadOnlyList<LibraryLoanDto>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty) throw new ArgumentException("A valid student id is required.", nameof(studentId));
        return (await library.GetStudentLoansAsync(studentId, activeOnly, cancellationToken)).Select(LibraryLoanDto.FromDomain).ToArray();
    }

    public async Task<LibraryBookDto> AddBookAsync(CreateLibraryBookRequest request, CancellationToken cancellationToken = default)
    {
        if (request.TotalCopies < 1) throw new ArgumentException("Total copies must be at least one.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Isbn)) throw new ArgumentException("ISBN is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Title)) throw new ArgumentException("Title is required.", nameof(request));
        if (string.IsNullOrWhiteSpace(request.Author)) throw new ArgumentException("Author is required.", nameof(request));

        return LibraryBookDto.FromDomain(await library.AddBookAsync(
            request.Isbn.Trim(), request.Title.Trim(), request.Author.Trim(), request.Publisher?.Trim(), request.TotalCopies, cancellationToken));
    }

    public async Task<LibraryLoanDto> IssueBookAsync(IssueLibraryBookRequest request, CancellationToken cancellationToken = default)
    {
        if (request.StudentId == Guid.Empty) throw new ArgumentException("A valid student id is required.", nameof(request));
        if (request.BookId == Guid.Empty) throw new ArgumentException("A valid book id is required.", nameof(request));
        if (request.DueAtUtc <= DateTime.UtcNow) throw new ArgumentException("Due date must be in the future.", nameof(request));

        return LibraryLoanDto.FromDomain(await library.IssueBookAsync(request.StudentId, request.BookId, request.DueAtUtc, cancellationToken));
    }

    public async Task<LibraryLoanDto> ReturnBookAsync(Guid loanId, ReturnLibraryBookRequest request, CancellationToken cancellationToken = default)
    {
        if (loanId == Guid.Empty) throw new ArgumentException("A valid loan id is required.", nameof(loanId));
        if (request.FinePerOverdueDay < 0) throw new ArgumentException("Fine per overdue day cannot be negative.", nameof(request));
        return LibraryLoanDto.FromDomain(await library.ReturnBookAsync(loanId, request.FinePerOverdueDay, cancellationToken));
    }
}
