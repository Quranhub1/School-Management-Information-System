using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Controllers;

[ApiController]
[Route("api/campuses/{campusId:guid}/users")]
[Authorize(Roles = "SystemAdministrator")]
public sealed class CampusAssignmentsController(SchoolManagementDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CampusUserResponse>>> Get(Guid campusId, CancellationToken cancellationToken)
    {
        if (!await db.Campuses.AnyAsync(x => x.Id == campusId, cancellationToken))
            return NotFound(new { message = "Campus was not found." });

        var assignments = await db.UserCampusAssignments.AsNoTracking()
            .Where(x => x.CampusId == campusId)
            .Join(db.Users.AsNoTracking(), assignment => assignment.UserId, user => user.Id,
                (assignment, user) => new CampusUserResponse(
                    user.Id, user.Username, user.FirstName, user.LastName, user.IsActive,
                    assignment.IsPrimary, assignment.AssignedAt))
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .ToListAsync(cancellationToken);
        return Ok(assignments);
    }

    [HttpPut]
    public async Task<ActionResult<CampusUserResponse>> Assign(
        Guid campusId,
        [FromBody] AssignCampusUserRequest request,
        CancellationToken cancellationToken)
    {
        if (request.UserId == Guid.Empty)
            return BadRequest(new { message = "A valid user ID is required." });

        var campus = await db.Campuses.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == campusId && x.IsActive, cancellationToken);
        if (campus is null)
            return NotFound(new { message = "The campus does not exist or is inactive." });

        var user = await db.Users.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == request.UserId && x.IsActive, cancellationToken);
        if (user is null)
            return NotFound(new { message = "The user does not exist or is inactive." });

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        if (request.IsPrimary)
        {
            var primaryAssignments = await db.UserCampusAssignments
                .Where(x => x.UserId == request.UserId && x.IsPrimary)
                .ToListAsync(cancellationToken);
            foreach (var assignment in primaryAssignments)
                assignment.IsPrimary = false;
            await db.SaveChangesAsync(cancellationToken);
        }

        var target = await db.UserCampusAssignments
            .SingleOrDefaultAsync(x => x.UserId == request.UserId && x.CampusId == campusId, cancellationToken);
        if (target is null)
        {
            target = new UserCampusAssignment
            {
                UserId = request.UserId,
                CampusId = campusId,
                IsPrimary = request.IsPrimary
            };
            db.UserCampusAssignments.Add(target);
        }
        else
        {
            target.IsPrimary = request.IsPrimary;
        }

        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return Ok(new CampusUserResponse(user.Id, user.Username, user.FirstName, user.LastName, user.IsActive, target.IsPrimary, target.AssignedAt));
    }

    [HttpDelete("{userId:guid}")]
    public async Task<IActionResult> Revoke(Guid campusId, Guid userId, CancellationToken cancellationToken)
    {
        var assignment = await db.UserCampusAssignments
            .SingleOrDefaultAsync(x => x.CampusId == campusId && x.UserId == userId, cancellationToken);
        if (assignment is null) return NotFound(new { message = "Campus access assignment was not found." });

        db.UserCampusAssignments.Remove(assignment);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    public sealed record AssignCampusUserRequest(Guid UserId, bool IsPrimary = false);
    public sealed record CampusUserResponse(Guid UserId, string Username, string FirstName, string LastName, bool IsActive, bool IsPrimary, DateTimeOffset AssignedAt);
}
