using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Library;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(
    LibraryWorkflowService library,
    IConfiguration configuration,
    SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet("books")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public Task<IReadOnlyList<LibraryBookDto>> Books(CancellationToken ct) => library.GetBooksAsync(ct);

    [HttpGet("members")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Members([FromQuery] string? search = null, CancellationToken ct = default)
    {
        var query = db.Students.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(student =>
                student.StudentNumber.Contains(term) ||
                student.FirstName.Contains(term) ||
                student.LastName.Contains(term) ||
                (student.OtherNames != null && student.OtherNames.Contains(term)));
        }

        var members = await query
            .OrderBy(student => student.StudentNumber)
            .Select(student => new
            {
                id = student.Id,
                studentNumber = student.StudentNumber,
                name = (student.FirstName + " " + (student.OtherNames ?? "") + " " + student.LastName).Trim()
            })
            .ToListAsync(ct);

        return Ok(members);
    }

    [HttpGet("books/{id:guid}/barcode")]
    [AllowAnonymous]
    public IActionResult GetBookBarcode(Guid id)
    {
        var barcode = BarcodeHelper.GenerateSvg(id.ToString());
        return Content(barcode, "image/svg+xml");
    }

    [HttpGet("loans")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public async Task<IActionResult> Loans([FromQuery] bool activeOnly = true, CancellationToken ct = default)
    {
        var query =
            from loan in db.LibraryLoans.AsNoTracking()
            join book in db.LibraryBooks.AsNoTracking() on loan.BookId equals book.Id
            join student in db.Students.AsNoTracking() on loan.StudentId equals student.Id
            select new { loan, book, student };

        if (activeOnly)
            query = query.Where(item => item.loan.ReturnedAtUtc == null);

        var loans = await query
            .OrderByDescending(item => item.loan.IssuedAtUtc)
            .Select(item => new
            {
                id = item.loan.Id,
                bookId = item.loan.BookId,
                bookTitle = item.book.Title,
                bookIsbn = item.book.Isbn,
                studentId = item.loan.StudentId,
                studentNumber = item.student.StudentNumber,
                studentName = (item.student.FirstName + " " + (item.student.OtherNames ?? "") + " " + item.student.LastName).Trim(),
                issuedAtUtc = item.loan.IssuedAtUtc,
                dueAtUtc = item.loan.DueAtUtc,
                returnedAtUtc = item.loan.ReturnedAtUtc,
                fineAmount = item.loan.FineAmount
            })
            .ToListAsync(ct);

        return Ok(loans);
    }

    [HttpGet("loans/{studentId:guid}")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public Task<IReadOnlyList<LibraryLoanDto>> StudentLoans(Guid studentId, [FromQuery] bool activeOnly = false, CancellationToken ct = default) =>
        library.GetStudentLoansAsync(studentId, activeOnly, ct);

    [HttpGet("integrations")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public IActionResult Integrations()
    {
        var kohaUrl = configuration["LibraryIntegrations:Koha:BaseUrl"]?.Trim() ?? string.Empty;
        var dspaceUrl = configuration["LibraryIntegrations:DSpace:BaseUrl"]?.Trim() ?? string.Empty;
        return Ok(new
        {
            koha = new { enabled = configuration.GetValue<bool>("LibraryIntegrations:Koha:Enabled") && Uri.TryCreate(kohaUrl, UriKind.Absolute, out _), baseUrl = kohaUrl },
            dspace = new { enabled = configuration.GetValue<bool>("LibraryIntegrations:DSpace:Enabled") && Uri.TryCreate(dspaceUrl, UriKind.Absolute, out _), baseUrl = dspaceUrl }
        });
    }

    [HttpPost("books")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> AddBook(CreateLibraryBookRequest request, CancellationToken ct)
    {
        try { return Ok(await library.AddBookAsync(request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
    }

    [HttpPost("loans")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Issue(IssueLibraryBookRequest request, CancellationToken ct)
    {
        try { return Ok(await library.IssueBookAsync(request, ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }

    [HttpPatch("loans/{id:guid}/return")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> Return(Guid id, [FromQuery] decimal finePerOverdueDay = 1000m, CancellationToken ct = default)
    {
        try { return Ok(await library.ReturnBookAsync(id, new ReturnLibraryBookRequest(finePerOverdueDay), ct)); }
        catch (ArgumentException ex) { return BadRequest(new { message = ex.Message }); }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
    }
}
