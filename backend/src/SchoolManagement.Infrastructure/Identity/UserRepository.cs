using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Administration;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class UserRepository(SchoolManagementDbContext db) : IUserRepository
{
    public Task<User?> FindByUsernameAsync(string username, CancellationToken cancellationToken = default) => db.Users.SingleOrDefaultAsync(x => x.Username == username, cancellationToken);

    public async Task<IReadOnlyList<string>> GetRolesAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await (from ur in db.UserRoles join role in db.Roles on ur.RoleId equals role.Id where ur.UserId == userId select role.Name).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<UserSummary>> GetUsersAsync(CancellationToken cancellationToken = default) =>
        await db.Users.AsNoTracking().OrderBy(x => x.Username).Select(x => new UserSummary(x.Id, x.Username, x.FirstName, x.LastName, x.Email, x.IsActive, x.CreatedAt, x.LastLoginAt,
            db.UserRoles.Where(ur => ur.UserId == x.Id).Join(db.Roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name).ToList())).ToListAsync(cancellationToken);

    public async Task<UserSummary?> GetUserAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await db.Users.AsNoTracking().Where(x => x.Id == userId).Select(x => new UserSummary(x.Id, x.Username, x.FirstName, x.LastName, x.Email, x.IsActive, x.CreatedAt, x.LastLoginAt,
            db.UserRoles.Where(ur => ur.UserId == x.Id).Join(db.Roles, ur => ur.RoleId, r => r.Id, (_, r) => r.Name).ToList())).SingleOrDefaultAsync(cancellationToken);

    public async Task AddUserAsync(User user, IReadOnlyList<string> roles, CancellationToken cancellationToken = default)
    {
        var roleEntities = await db.Roles.Where(r => roles.Contains(r.Name)).ToListAsync(cancellationToken);
        if (roleEntities.Count != roles.Count) throw new ArgumentException("One or more requested roles do not exist.");
        db.Users.Add(user);
        foreach (var role in roleEntities) db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
    }

    public async Task<User?> SetActiveAsync(Guid userId, bool active, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is not null) user.IsActive = active;
        return user;
    }

    public async Task<UserSummary?> UpdateUserAsync(Guid userId, string firstName, string lastName, string? email, IReadOnlyList<string> roles, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is null) return null;

        var roleNames = roles.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var roleEntities = await db.Roles.Where(r => roleNames.Contains(r.Name)).ToListAsync(cancellationToken);
        if (roleEntities.Count != roleNames.Length)
            throw new ArgumentException("One or more requested roles do not exist.");

        user.FirstName = firstName;
        user.LastName = lastName;
        user.Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();

        var currentAssignments = await db.UserRoles.Where(ur => ur.UserId == userId).ToListAsync(cancellationToken);
        var desiredRoleIds = roleEntities.Select(role => role.Id).ToHashSet();
        db.UserRoles.RemoveRange(currentAssignments.Where(assignment => !desiredRoleIds.Contains(assignment.RoleId)));
        var currentRoleIds = currentAssignments.Select(assignment => assignment.RoleId).ToHashSet();
        foreach (var role in roleEntities.Where(role => !currentRoleIds.Contains(role.Id)))
            db.UserRoles.Add(new UserRole { UserId = userId, RoleId = role.Id });

        await db.SaveChangesAsync(cancellationToken);
        return await GetUserAsync(userId, cancellationToken);
    }

    public async Task<User?> SetPasswordHashAsync(Guid userId, string passwordHash, CancellationToken cancellationToken = default)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is not null) user.PasswordHash = passwordHash;
        return user;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
