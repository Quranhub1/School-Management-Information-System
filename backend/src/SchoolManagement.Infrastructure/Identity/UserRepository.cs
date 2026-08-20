using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class UserRepository(SchoolManagementDbContext db) : IUserRepository
{
    public Task<User?> FindByUsernameAsync(string username, CancellationToken cancellationToken = default) =>
        db.Users.SingleOrDefaultAsync(x => x.Username == username, cancellationToken);

    public async Task<IReadOnlyList<string>> GetRolesAsync(Guid userId, CancellationToken cancellationToken = default) =>
        await (from ur in db.UserRoles
               join role in db.Roles on ur.RoleId equals role.Id
               where ur.UserId == userId
               select role.Name).ToListAsync(cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
