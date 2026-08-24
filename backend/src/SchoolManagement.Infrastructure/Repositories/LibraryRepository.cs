using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Library;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class LibraryRepository(SchoolManagementDbContext db) : ILibraryRepository
{
    public Task<LibraryBook?> GetBookAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LibraryBooks.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<LibraryBook?> GetBookByIsbnAsync(string isbn, CancellationToken cancellationToken = default) =>
        db.LibraryBooks.SingleOrDefaultAsync(x => x.Isbn == isbn, cancellationToken);

    public Task<Librarian?> GetLibrarianAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Librarians.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<LibraryLoan?> GetLoanAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LibraryLoans.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<LibraryBook>> GetBooksAsync(CancellationToken cancellationToken = default) =>
        await db.LibraryBooks.AsNoTracking().OrderBy(x => x.Title).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<LibraryLoan>> GetStudentLoansAsync(Guid studentId, bool activeOnly = false, CancellationToken cancellationToken = default)
    {
        var query = db.LibraryLoans.AsNoTracking().Where(x => x.StudentId == studentId);
        if (activeOnly) query = query.Where(x => x.ReturnedAtUtc == null);
        return await query.OrderByDescending(x => x.IssuedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Librarian>> GetLibrariansAsync(CancellationToken cancellationToken = default) =>
        await db.Librarians.AsNoTracking().OrderBy(x => x.LibraryRole).ToListAsync(cancellationToken);

    public Task AddBookAsync(LibraryBook book, CancellationToken cancellationToken = default) =>
        db.LibraryBooks.AddAsync(book, cancellationToken).AsTask();

    public Task AddLibrarianAsync(Librarian librarian, CancellationToken cancellationToken = default) =>
        db.Librarians.AddAsync(librarian, cancellationToken).AsTask();

    public Task AddLoanAsync(LibraryLoan loan, CancellationToken cancellationToken = default) =>
        db.LibraryLoans.AddAsync(loan, cancellationToken).AsTask();

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
