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

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
