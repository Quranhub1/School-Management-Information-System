using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("books")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Books([FromQuery] string? search, CancellationToken ct)
    {
        var q = db.LibraryBooks.AsNoTracking().Where(x => x.IsActive);
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(x => x.Title.Contains(search) || x.Author.Contains(search) || x.Isbn.Contains(search));
        return Ok(await q.OrderBy(x => x.Title).ToListAsync(ct));
    }

    [HttpPost("books")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> AddBook(CreateBookRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Isbn) || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Author) || request.TotalCopies < 1) return BadRequest(new { message = "ISBN, title, author and at least one copy are required." });
        if (await db.LibraryBooks.AnyAsync(x => x.Isbn == request.Isbn.Trim(), ct)) return Conflict(new { message = "A book with this ISBN already exists." });
        var book = new LibraryBook { Isbn = request.Isbn.Trim(), Title = request.Title.Trim(), Author = request.Author.Trim(), Publisher = request.Publisher?.Trim(), TotalCopies = request.TotalCopies, AvailableCopies = request.TotalCopies };
        db.LibraryBooks.Add(book); await db.SaveChangesAsync(ct); return Created($"api/library/books/{book.Id}", book);
    }

    [HttpPost("loans")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Issue(IssueLoanRequest request, CancellationToken ct)
    {
        var book = await db.LibraryBooks.SingleOrDefaultAsync(x => x.Id == request.BookId && x.IsActive, ct);
        if (book is null) return NotFound(new { message = "Book not found." });
        if (book.AvailableCopies < 1) return Conflict(new { message = "No available copy of this book." });
        if (!await db.Students.AnyAsync(x => x.Id == request.StudentId, ct)) return BadRequest(new { message = "Student not found." });
        if (await db.LibraryLoans.AnyAsync(x => x.StudentId == request.StudentId && x.BookId == request.BookId && x.ReturnedAtUtc == null, ct)) return Conflict(new { message = "This student already has this book on loan." });
        if (request.DueAtUtc <= DateTime.UtcNow) return BadRequest(new { message = "Due date must be in the future." });
        var loan = new LibraryLoan { BookId = book.Id, StudentId = request.StudentId, DueAtUtc = request.DueAtUtc.ToUniversalTime() };
        book.AvailableCopies--; db.LibraryLoans.Add(loan); await db.SaveChangesAsync(ct); return Created($"api/library/loans/{loan.Id}", loan);
    }

    [HttpPatch("loans/{id:guid}/return")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Return(Guid id, CancellationToken ct)
    {
        var loan = await db.LibraryLoans.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (loan is null) return NotFound(); if (loan.ReturnedAtUtc is not null) return Conflict(new { message = "Loan already returned." });
        var book = await db.LibraryBooks.SingleAsync(x => x.Id == loan.BookId, ct); loan.ReturnedAtUtc = DateTime.UtcNow; if (loan.ReturnedAtUtc > loan.DueAtUtc) loan.FineAmount = Math.Round((decimal)(loan.ReturnedAtUtc.Value - loan.DueAtUtc).TotalDays, 0) * 500m; book.AvailableCopies = Math.Min(book.TotalCopies, book.AvailableCopies + 1); await db.SaveChangesAsync(ct); return Ok(loan);
    }
}

public sealed record CreateBookRequest(string Isbn, string Title, string Author, string? Publisher, int TotalCopies);
public sealed record IssueLoanRequest(Guid BookId, Guid StudentId, DateTime DueAtUtc);
