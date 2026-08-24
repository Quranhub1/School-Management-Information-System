using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Library;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(LibraryService library, IConfiguration configuration) : ControllerBase
{
    [HttpGet("books")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Books(CancellationToken ct) => Ok(await library.GetBooksAsync(ct));

    [HttpGet("librarians")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Librarians(CancellationToken ct) => Ok(await library.GetLibrariansAsync(ct));

    [HttpGet("loans/{studentId:guid}")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> StudentLoans(Guid studentId, [FromQuery] bool activeOnly = false, CancellationToken ct = default) =>
        Ok(await library.GetStudentLoansAsync(studentId, activeOnly, ct));

    [HttpGet("integrations")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public IActionResult Integrations() => Ok(new
    {
        koha = new
        {
            enabled = configuration.GetValue<bool>("LibraryIntegrations:Koha:Enabled"),
            baseUrl = configuration["LibraryIntegrations:Koha:BaseUrl"]
        },
        dspace = new
        {
            enabled = configuration.GetValue<bool>("LibraryIntegrations:DSpace:Enabled"),
            baseUrl = configuration["LibraryIntegrations:DSpace:BaseUrl"]
        }
    });

    [HttpPost("books")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> AddBook(CreateBookRequest request, CancellationToken ct)
    {
        try
        {
            var book = await library.AddBookAsync(request.Isbn, request.Title, request.Author, request.Publisher, request.TotalCopies, ct);
            return Created($"/api/library/books/{book.Id}", book);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("librarians")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> AddLibrarian(AddLibrarianRequest request, CancellationToken ct)
    {
        try { return Ok(await library.AddLibrarianAsync(request.StaffMemberId, request.LibraryRole, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("loans")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Issue(IssueLoanRequest request, CancellationToken ct)
    {
        try
        {
            var loan = await library.IssueBookAsync(request.StudentId, request.BookId, request.DueAtUtc.ToUniversalTime(), ct);
            return Created($"/api/library/loans/{loan.Id}", loan);
        }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPatch("loans/{id:guid}/return")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Return(Guid id, [FromQuery] decimal finePerOverdueDay = 1000m, CancellationToken ct = default)
    {
        try { return Ok(await library.ReturnBookAsync(id, finePerOverdueDay, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }
}

public sealed record CreateBookRequest(string Isbn, string Title, string Author, string? Publisher, int TotalCopies);
public sealed record AddLibrarianRequest(Guid StaffMemberId, string LibraryRole);
public sealed record IssueLoanRequest(Guid BookId, Guid StudentId, DateTime DueAtUtc);
