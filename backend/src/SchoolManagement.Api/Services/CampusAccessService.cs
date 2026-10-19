using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Services;

/// <summary>
/// Resolves campus access from server-managed assignments. A null campus list means
/// the installation is still in legacy single-campus mode (no campuses configured).
/// </summary>
public sealed class CampusAccessService(SchoolManagementDbContext db)
{
    public bool IsSystemAdministrator(ClaimsPrincipal principal) => principal.IsInRole("SystemAdministrator");

    public async Task<IReadOnlyList<Guid>?> GetAccessibleCampusIdsAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        var activeCampusIds = await db.Campuses.AsNoTracking().Where(x => x.IsActive).Select(x => x.Id).ToListAsync(cancellationToken);
        if (activeCampusIds.Count == 0) return null;
        if (IsSystemAdministrator(principal)) return activeCampusIds;

        var userId = GetUserId(principal);
        if (userId is null) return [];
        return await db.UserCampusAssignments.AsNoTracking()
            .Where(x => x.UserId == userId.Value && activeCampusIds.Contains(x.CampusId))
            .Select(x => x.CampusId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> CanAccessCampusAsync(ClaimsPrincipal principal, Guid? campusId, CancellationToken cancellationToken = default)
    {
        if (IsSystemAdministrator(principal)) return true;
        if (!await db.Campuses.AnyAsync(x => x.IsActive, cancellationToken)) return true;
        if (campusId is null) return false;

        var userId = GetUserId(principal);
        return userId.HasValue && await db.UserCampusAssignments.AnyAsync(
            x => x.UserId == userId.Value && x.CampusId == campusId.Value && x.CampusId != Guid.Empty,
            cancellationToken);
    }

    public async Task<bool> CanAccessStudentAsync(ClaimsPrincipal principal, Guid studentId, CancellationToken cancellationToken = default)
    {
        if (IsSystemAdministrator(principal)) return true;
        if (!await db.Campuses.AnyAsync(x => x.IsActive, cancellationToken)) return true;

        var campusId = await db.Students.AsNoTracking()
            .Where(x => x.Id == studentId)
            .Select(x => x.CampusId)
            .SingleOrDefaultAsync(cancellationToken);
        return await CanAccessCampusAsync(principal, campusId, cancellationToken);
    }

    public async Task<Guid?> ResolveCampusForWriteAsync(ClaimsPrincipal principal, Guid? requestedCampusId, CancellationToken cancellationToken = default)
    {
        var activeCampuses = db.Campuses.AsNoTracking().Where(x => x.IsActive);
        if (!await activeCampuses.AnyAsync(cancellationToken)) return null;

        if (IsSystemAdministrator(principal))
        {
            if (requestedCampusId.HasValue)
                return await activeCampuses.Where(x => x.Id == requestedCampusId.Value).Select(x => (Guid?)x.Id).SingleOrDefaultAsync(cancellationToken);
            return await activeCampuses.OrderBy(x => x.Code).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
        }

        var userId = GetUserId(principal);
        if (!userId.HasValue) return null;
        var assignments = db.UserCampusAssignments.AsNoTracking().Where(x => x.UserId == userId.Value);
        if (requestedCampusId.HasValue)
            return await assignments.Where(x => x.CampusId == requestedCampusId.Value)
                .Join(activeCampuses, a => a.CampusId, c => c.Id, (a, c) => (Guid?)c.Id)
                .SingleOrDefaultAsync(cancellationToken);

        var primary = await assignments.Where(x => x.IsPrimary)
            .Join(activeCampuses, a => a.CampusId, c => c.Id, (a, c) => (Guid?)c.Id)
            .SingleOrDefaultAsync(cancellationToken);
        if (primary.HasValue) return primary;
        return await assignments.Join(activeCampuses, a => a.CampusId, c => c.Id, (a, c) => (Guid?)c.Id)
            .OrderBy(x => x).FirstOrDefaultAsync(cancellationToken);
    }

    private static Guid? GetUserId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id) ? id : null;
}
