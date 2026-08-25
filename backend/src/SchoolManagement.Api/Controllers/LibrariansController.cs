using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Library;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/library/librarians")]
[Authorize(Policy = LibraryPolicies.Management)]
public sealed class LibrariansController(SchoolManagementDbContext db) : ControllerBase
{
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
        if (string.IsNullOrWhiteSpace(role)) return BadRequest(new { message = "Library role is required." });
        if (role.Length > 100) return BadRequest(new { message = "Library role must not exceed 100 characters." });

        var staff = await db.StaffMembers.SingleOrDefaultAsync(x => x.Id == request.StaffMemberId, ct);
        if (staff is null) return NotFound(new { message = "Staff member not found." });
        if (!staff.IsActive) return Conflict(new { message = "An inactive staff member cannot be assigned as a librarian." });
        if (await db.Librarians.AnyAsync(x => x.StaffMemberId == request.StaffMemberId, ct))
            return Conflict(new { message = "This staff member is already registered as a librarian." });

        var librarian = new Librarian { StaffMemberId = request.StaffMemberId, LibraryRole = role };
        db.Librarians.Add(librarian);
        await db.SaveChangesAsync(ct);
        return Created($"api/library/librarians/{librarian.Id}", librarian);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, UpdateLibrarianRequest request, CancellationToken ct)
    {
        var role = request.LibraryRole?.Trim();
        if (string.IsNullOrWhiteSpace(role)) return BadRequest(new { message = "Library role is required." });
        if (role.Length > 100) return BadRequest(new { message = "Library role must not exceed 100 characters." });

        var librarian = await db.Librarians.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (librarian is null) return NotFound(new { message = "Librarian not found." });

        librarian.LibraryRole = role;
        librarian.IsActive = request.IsActive;
        librarian.DeactivatedAtUtc = request.IsActive ? null : librarian.DeactivatedAtUtc ?? DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(librarian);
    }
}

public sealed record LibrarianView(Guid Id, Guid StaffMemberId, string StaffNumber, string FirstName, string LastName, string? PhoneNumber, string? Email, string LibraryRole, bool IsActive, DateTime AssignedAtUtc, DateTime? DeactivatedAtUtc);
public sealed record CreateLibrarianRequest(Guid StaffMemberId, string LibraryRole);
public sealed record UpdateLibrarianRequest(string LibraryRole, bool IsActive);
