using SchoolManagement.Domain.Library;

namespace SchoolManagement.Application.Library;

public sealed record LibraryBookDto(Guid Id, string Isbn, string Title, string Author, string? Publisher, int TotalCopies, int AvailableCopies, bool IsActive)
{
    public static LibraryBookDto FromDomain(LibraryBook x) => new(x.Id, x.Isbn, x.Title, x.Author, x.Publisher, x.TotalCopies, x.AvailableCopies, x.IsActive);
}

public sealed record LibraryLoanDto(Guid Id, Guid BookId, Guid StudentId, DateTime IssuedAtUtc, DateTime DueAtUtc, DateTime? ReturnedAtUtc, decimal FineAmount)
{
    public static LibraryLoanDto FromDomain(LibraryLoan x) => new(x.Id, x.BookId, x.StudentId, x.IssuedAtUtc, x.DueAtUtc, x.ReturnedAtUtc, x.FineAmount);
}

public sealed record CreateLibraryBookRequest(string Isbn, string Title, string Author, string? Publisher, int TotalCopies);
public sealed record IssueLibraryBookRequest(Guid StudentId, Guid BookId, DateTime DueAtUtc);
public sealed record ReturnLibraryBookRequest(decimal FinePerOverdueDay = 1000m);
