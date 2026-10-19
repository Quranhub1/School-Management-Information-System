using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Api.Services;

/// <summary>
/// Resolves campus access from server-managed assignments for the active institution.
/// A null campus list means no active campus is configured and legacy single-campus
/// behavior is retained until the first campus is registered.
/// </summary>
public sealed class CampusAccessService(SchoolManagementDbContext db)
{
    public bool IsSystemAdministrator(ClaimsPrincipal principal) => principal.IsInRole("SystemAdministrator");

    public async Task<IReadOnlyList<Guid>?> GetAccessibleCampusIdsAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        var activeCampusIds = await GetActiveInstitutionCampusIdsAsync(cancellationToken);
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
        var activeCampusIds = await GetActiveInstitutionCampusIdsAsync(cancellationToken);
        if (activeCampusIds.Count == 0) return true;
        if (campusId is null || !activeCampusIds.Contains(campusId.Value)) return false;

        var userId = GetUserId(principal);
        return userId.HasValue && await db.UserCampusAssignments.AnyAsync(
            x => x.UserId == userId.Value && x.CampusId == campusId.Value,
            cancellationToken);
    }

    public async Task<bool> CanAccessStudentAsync(ClaimsPrincipal principal, Guid studentId, CancellationToken cancellationToken = default)
    {
        if (IsSystemAdministrator(principal)) return true;
        if ((await GetActiveInstitutionCampusIdsAsync(cancellationToken)).Count == 0) return true;

        var campusId = await db.Students.AsNoTracking()
            .Where(x => x.Id == studentId)
            .Select(x => x.CampusId)
            .SingleOrDefaultAsync(cancellationToken);
        return await CanAccessCampusAsync(principal, campusId, cancellationToken);
    }

    public async Task<Guid?> ResolveCampusForWriteAsync(ClaimsPrincipal principal, Guid? requestedCampusId, CancellationToken cancellationToken = default)
    {
        var activeCampusIds = await GetActiveInstitutionCampusIdsAsync(cancellationToken);
        if (activeCampusIds.Count == 0) return null;

        if (IsSystemAdministrator(principal))
        {
            if (requestedCampusId.HasValue)
                return activeCampusIds.Contains(requestedCampusId.Value) ? requestedCampusId : null;
            var adminUserId = GetUserId(principal);
            if (adminUserId.HasValue)
            {
                var primaryCampusId = await db.UserCampusAssignments.AsNoTracking()
                    .Where(x => x.UserId == adminUserId.Value && x.IsPrimary && activeCampusIds.Contains(x.CampusId))
                    .Select(x => (Guid?)x.CampusId)
                    .FirstOrDefaultAsync(cancellationToken);
                if (primaryCampusId.HasValue) return primaryCampusId;
            }
            return await db.Campuses.AsNoTracking().Where(x => activeCampusIds.Contains(x.Id)).OrderBy(x => x.Code).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
        }

        var userId = GetUserId(principal);
        if (!userId.HasValue) return null;
        var assignments = db.UserCampusAssignments.AsNoTracking()
            .Where(x => x.UserId == userId.Value && activeCampusIds.Contains(x.CampusId));
        if (requestedCampusId.HasValue)
            return await assignments.Where(x => x.CampusId == requestedCampusId.Value)
                .Select(x => (Guid?)x.CampusId).SingleOrDefaultAsync(cancellationToken);

        var primary = await assignments.Where(x => x.IsPrimary)
            .Select(x => (Guid?)x.CampusId).SingleOrDefaultAsync(cancellationToken);
        if (primary.HasValue) return primary;
        return await assignments.OrderBy(x => x.CampusId)
            .Select(x => (Guid?)x.CampusId).FirstOrDefaultAsync(cancellationToken);
    }

    private async Task<List<Guid>> GetActiveInstitutionCampusIdsAsync(CancellationToken cancellationToken)
    {
        var settings = await db.InstitutionSettings.AsNoTracking()
            .Where(x => x.IsActive).OrderBy(x => x.Id)
            .Select(x => new { x.InstitutionName, x.Abbreviation })
            .FirstOrDefaultAsync(cancellationToken);
        if (settings is null)
            return await db.Campuses.AsNoTracking().Where(x => x.IsActive).Select(x => x.Id).ToListAsync(cancellationToken);

        var source = string.IsNullOrWhiteSpace(settings.Abbreviation) ? settings.InstitutionName : settings.Abbreviation;
        var code = new string(source.Trim().ToUpperInvariant().Where(char.IsLetterOrDigit).Take(50).ToArray());
        var institutionId = await db.Institutions.AsNoTracking()
            .Where(x => x.Code == (string.IsNullOrWhiteSpace(code) ? "SCHOOL" : code) || x.Name == settings.InstitutionName)
            .Select(x => (Guid?)x.Id)
            .FirstOrDefaultAsync(cancellationToken);
        if (!institutionId.HasValue) return [];

        return await db.Campuses.AsNoTracking()
            .Where(x => x.InstitutionId == institutionId.Value && x.IsActive)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    private static Guid? GetUserId(ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id) ? id : null;
}
