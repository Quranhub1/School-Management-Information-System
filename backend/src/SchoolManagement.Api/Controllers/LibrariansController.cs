using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library/librarians")]
[Authorize(Policy = LibraryPolicies.Management)]
public sealed class LibrariansController(
    SchoolManagementDbContext db,
    ILogger<LibrariansController> logger) : ControllerBase
{
    private const int MaxLibraryRoleLength = 80;

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var librarians = await db.Librarians.AsNoTracking()
            .Join(db.StaffMembers, l => l.StaffMemberId, s => s.Id, (l, s) => new LibrarianView(
                l.Id, s.Id, s.StaffNumber, s.FirstName, s.LastName, s.PhoneNumber, s.Email,
                l.LibraryRole, l.IsActive, l.AssignedAtUtc, l.DeactivatedAtUtc))
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName).ToListAsync(ct);
        return Ok(librarians);
    }

    [HttpPost]
    public async Task<IActionResult> Add(CreateLibrarianRequest request, CancellationToken ct)
    {
        var role = request.LibraryRole?.Trim();
        if (string.IsNullOrWhiteSpace(role))
            return BadRequest(new { message = "Library role is required." });
        if (role.Length > MaxLibraryRoleLength)
            return BadRequest(new { message = $"Library role must not exceed {MaxLibraryRoleLength} characters." });

        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == request.StaffMemberId, ct);
        if (staff is null) return NotFound(new { message = "Staff member not found." });
        if (!staff.IsActive)
            return Conflict(new { message = "An inactive staff member cannot be assigned as a librarian." });

        if (await db.Librarians.AnyAsync(x => x.StaffMemberId == request.StaffMemberId, ct))
            return Conflict(new { message = "This staff member is already registered as a librarian." });

        var librarian = new Librarian { StaffMemberId = request.StaffMemberId, LibraryRole = role };
        db.Librarians.Add(librarian);

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            return HandlePersistenceFailure(ex, "assign librarian");
        }

        return CreatedAtAction(nameof(List), new { id = librarian.Id }, librarian);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateLibrarianRequest request, CancellationToken ct)
    {
        var role = request.LibraryRole?.Trim();
        if (string.IsNullOrWhiteSpace(role))
            return BadRequest(new { message = "Library role is required." });
        if (role.Length > MaxLibraryRoleLength)
            return BadRequest(new { message = $"Library role must not exceed {MaxLibraryRoleLength} characters." });

        var librarian = await db.Librarians.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (librarian is null) return NotFound(new { message = "Librarian not found." });

        librarian.LibraryRole = role;
        librarian.IsActive = request.IsActive;
        librarian.DeactivatedAtUtc = request.IsActive ? null : librarian.DeactivatedAtUtc ?? DateTime.UtcNow;

        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex)
        {
            return HandlePersistenceFailure(ex, $"update librarian {id}");
        }

        return Ok(librarian);
    }

    private IActionResult HandlePersistenceFailure(DbUpdateException exception, string operation)
    {
        var postgres = exception.GetBaseException() as PostgresException;
        if (postgres is not null)
        {
            logger.LogWarning(exception,
                "Database rejected library operation {Operation}. PostgreSQL SQLSTATE: {SqlState}; constraint: {Constraint}",
                operation, postgres.SqlState, postgres.ConstraintName);

            return postgres.SqlState switch
            {
                PostgresErrorCodes.UniqueViolation =>
                    Conflict(new { message = "This staff member is already registered as a librarian." }),
                PostgresErrorCodes.ForeignKeyViolation =>
                    Conflict(new { message = "The selected staff record no longer exists. Refresh the staff list and try again." }),
                PostgresErrorCodes.StringDataRightTruncation =>
                    BadRequest(new { message = "One of the supplied values exceeds the allowed length." }),
                _ => ServerError()
            };
        }

        logger.LogError(exception, "Failed to {Operation} because the database could not save the change.", operation);
        return ServerError();
    }

    private ObjectResult ServerError() =>
        Problem(
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Library staff could not be saved",
            detail: "The server could not save this library staff change. The backend log contains the underlying database error. Please try again or contact the system administrator.");
}

public sealed record LibrarianView(Guid Id, Guid StaffMemberId, string StaffNumber, string FirstName, string LastName, string? PhoneNumber, string? Email, string LibraryRole, bool IsActive, DateTime AssignedAtUtc, DateTime? DeactivatedAtUtc);
public sealed record CreateLibrarianRequest(Guid StaffMemberId, string LibraryRole);
public sealed record UpdateLibrarianRequest(string LibraryRole, bool IsActive);
