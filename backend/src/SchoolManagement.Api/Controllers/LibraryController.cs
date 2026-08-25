using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Library;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(LibraryWorkflowService library, IConfiguration configuration) : ControllerBase
{
    [HttpGet("books")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public Task<IReadOnlyList<LibraryBookDto>> Books(CancellationToken ct) => library.GetBooksAsync(ct);

    [HttpGet("loans/{studentId:guid}")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public Task<IReadOnlyList<LibraryLoanDto>> StudentLoans(Guid studentId, [FromQuery] bool activeOnly = false, CancellationToken ct = default) =>
        library.GetStudentLoansAsync(studentId, activeOnly, ct);

    [HttpGet("integrations")]
    [Authorize(Policy = LibraryPolicies.Read)]
    public IActionResult Integrations() => Ok(new
    {
        koha = new { enabled = configuration.GetValue<bool>("LibraryIntegrations:Koha:Enabled"), baseUrl = configuration["LibraryIntegrations:Koha:BaseUrl"] },
        dspace = new { enabled = configuration.GetValue<bool>("LibraryIntegrations:DSpace:Enabled"), baseUrl = configuration["LibraryIntegrations:DSpace:BaseUrl"] }
    });

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
