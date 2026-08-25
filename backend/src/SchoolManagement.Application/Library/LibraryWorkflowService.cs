using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Library;

public sealed class LibraryWorkflowService(LibraryService library)
{
    public async Task<IReadOnlyList<LibraryBookDto>> GetBooksAsync(CancellationToken cancellationToken = default) =>
        (await library.GetBooksAsync(cancellationToken)).Select(LibraryBookDto.FromDomain).ToArray();

    public async Task<IReadOnlyList<LibraryLoanDto>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default) =>
        (await library.GetStudentLoansAsync(studentId, activeOnly, cancellationToken)).Select(LibraryLoanDto.FromDomain).ToArray();

    public async Task<LibraryBookDto> AddBookAsync(CreateLibraryBookRequest request, CancellationToken cancellationToken = default) =>
        LibraryBookDto.FromDomain(await library.AddBookAsync(request.Isbn, request.Title, request.Author, request.Publisher, request.TotalCopies, cancellationToken));

    public async Task<LibraryLoanDto> IssueBookAsync(IssueLibraryBookRequest request, CancellationToken cancellationToken = default) =>
        LibraryLoanDto.FromDomain(await library.IssueBookAsync(request.StudentId, request.BookId, request.DueAtUtc, cancellationToken));

    public async Task<LibraryLoanDto> ReturnBookAsync(Guid loanId, ReturnLibraryBookRequest request, CancellationToken cancellationToken = default) =>
        LibraryLoanDto.FromDomain(await library.ReturnBookAsync(loanId, request.FinePerOverdueDay, cancellationToken));
}
