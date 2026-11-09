using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SchoolManagement.Api.Helpers;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Application.Library;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Api.Services;
using SchoolManagement.Domain.Workflows;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library")]
public sealed class LibraryController(
    LibraryWorkflowService library,
    IConfiguration configuration,
    SchoolManagementDbContext db,
    CampusAccessService campusAccess) : ControllerBase
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

    // Librarians own course-specific book purchase/fee requirements. These are stored
    // as ordinary programme fee structures so Finance can invoice and receipt them.
    [HttpGet("programme-requirements")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> ProgrammeRequirements(CancellationToken ct)
    {
        var requirements = await db.FeeStructures.AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.FeeType == "LibraryBook")
            .OrderBy(x => x.Name)
            .ToListAsync(ct);
        return Ok(requirements);
    }

    [HttpPost("programme-requirements")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> SetProgrammeRequirement(SetLibraryProgrammeRequirementRequest request, CancellationToken ct)
    {
        if (request.ProgrammeId == Guid.Empty) return BadRequest(new { message = "Select a course/programme." });
        if (string.IsNullOrWhiteSpace(request.Name)) return BadRequest(new { message = "Requirement name is required." });
        if (request.Amount <= 0) return BadRequest(new { message = "The book fee must be greater than zero." });
        if (!await db.Programmes.AnyAsync(x => x.Id == request.ProgrammeId && x.IsActive, ct))
            return BadRequest(new { message = "The selected programme is not active." });

        var currency = string.IsNullOrWhiteSpace(request.Currency) ? "UGX" : request.Currency.Trim().ToUpperInvariant();
        // Keep one active Library requirement per programme so a student is never
        // billed twice for competing versions of the same course book policy.
        var previousRequirements = await db.FeeStructures
            .Where(x => x.ProgrammeId == request.ProgrammeId && x.FeeType == "LibraryBook" && x.IsActive)
            .ToListAsync(ct);
        foreach (var previous in previousRequirements) previous.IsActive = false;

        // Reuse an existing same-name policy rather than violating the unique
        // programme/year/name index when the librarian revises its amount.
        var structure = await db.FeeStructures.Include(x => x.Items)
            .SingleOrDefaultAsync(x => x.ProgrammeId == request.ProgrammeId &&
                x.AcademicYearId == Guid.Empty && x.Name == request.Name.Trim(), ct);
        if (structure is null)
        {
            structure = new SchoolManagement.Domain.Finance.FeeStructure
            {
                ProgrammeId = request.ProgrammeId,
                AcademicYearId = Guid.Empty,
                Name = request.Name.Trim(),
                FeeType = "LibraryBook",
                Currency = currency
            };
            db.FeeStructures.Add(structure);
        }
        else
        {
            db.FeeStructureItems.RemoveRange(structure.Items);
            structure.Items.Clear();
            structure.Currency = currency;
            structure.FeeType = "LibraryBook";
            structure.IsActive = true;
        }
        structure.Items.Add(new SchoolManagement.Domain.Finance.FeeStructureItem
        {
            FeeStructureId = structure.Id,
            Code = "LIB-BOOK",
            Name = request.Name.Trim(),
            Amount = decimal.Round(request.Amount, 2, MidpointRounding.AwayFromZero),
            Currency = currency,
            SortOrder = 1,
            IsOptional = false
        });
        structure.RecalculateTotal();
        await db.SaveChangesAsync(ct);
        return Created($"/api/library/programme-requirements/{structure.Id}", structure);
    }

    [HttpPatch("programme-requirements/{id:guid}/active")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> SetProgrammeRequirementActive(Guid id, [FromQuery] bool active, CancellationToken ct)
    {
        var requirement = await db.FeeStructures.SingleOrDefaultAsync(x => x.Id == id && x.FeeType == "LibraryBook", ct);
        if (requirement is null) return NotFound();
        requirement.IsActive = active;
        await db.SaveChangesAsync(ct);
        return Ok(new { requirement.Id, requirement.IsActive });
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

    [HttpPost("students/{studentId:guid}/clearance")]
    [Authorize(Policy = LibraryPolicies.Management)]
    public async Task<IActionResult> ClearStudentLibraryRequirement(Guid studentId, LibraryClearanceRequest request, CancellationToken ct)
    {
        if (!await campusAccess.CanAccessStudentAsync(User, studentId, ct)) return Forbid();
        var studentExists = await db.Students.AsNoTracking().AnyAsync(x => x.Id == studentId, ct);
        if (!studentExists) return NotFound(new { message = "Student was not found." });

        var method = request.Method?.Trim();
        if (!string.Equals(method, "BookIssued", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(method, "FeePaid", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Clearance method must be BookIssued or FeePaid." });

        if (string.Equals(method, "FeePaid", StringComparison.OrdinalIgnoreCase))
        {
            var libraryInvoices = db.StudentInvoices.AsNoTracking()
                .Where(x => x.StudentId == studentId && x.FeeType == "LibraryBook");
            if (!await libraryInvoices.AnyAsync(ct))
                return Conflict(new { message = "No Library book-fee invoice exists for this student. The Librarian must configure the course requirement first." });
            var outstanding = await libraryInvoices
                .SumAsync(x => (decimal?)(x.Amount - x.DiscountAmount - x.PaidAmount), ct) ?? 0m;
            if (outstanding > 0)
                return Conflict(new { message = $"Library book fee is not fully paid. Outstanding: {outstanding:N0} UGX." });
        }
        else if (string.IsNullOrWhiteSpace(request.Reference))
        {
            return BadRequest(new { message = "Record the book title or ISBN issued to the student." });
        }

        var clearance = await db.WorkflowInstances.SingleOrDefaultAsync(x =>
            x.EntityType == "StudentClearance" && x.EntityId == studentId &&
            x.WorkflowType == "Library", ct);
        if (clearance is null)
        {
            clearance = new WorkflowInstance
            {
                WorkflowType = "Library",
                EntityType = "StudentClearance",
                EntityId = studentId,
                CurrentState = "Cleared"
            };
            db.WorkflowInstances.Add(clearance);
        }
        clearance.CurrentState = "Cleared";
        clearance.IsCompleted = true;
        clearance.Comments = $"{method}: {request.Reference?.Trim()}";
        clearance.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(new { clearance.Id, office = clearance.WorkflowType, status = clearance.CurrentState, clearance.Comments, clearance.UpdatedAt });
    }

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

public sealed record SetLibraryProgrammeRequirementRequest(Guid ProgrammeId, string Name, decimal Amount, string? Currency = "UGX");

public sealed record LibraryClearanceRequest(string Method, string? Reference = null);
