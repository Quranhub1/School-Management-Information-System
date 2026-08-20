using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class AdminSeeder(SchoolManagementDbContext db, PasswordHasher hasher)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var role = await db.Roles.SingleOrDefaultAsync(x => x.Name == InstitutionalRoles.SystemAdministrator, cancellationToken);
        if (role is null)
        {
            role = new Role
            {
                Name = InstitutionalRoles.SystemAdministrator,
                Description = "Full institutional system administration access.",
                IsSystemRole = true
            };
            db.Roles.Add(role);
        }

        var user = await db.Users.SingleOrDefaultAsync(x => x.Username == "admin", cancellationToken);
        if (user is null)
        {
            user = new User
            {
                Username = "admin",
                PasswordHash = hasher.Hash("admin123"),
                FirstName = "System",
                LastName = "Administrator",
                IsActive = true
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(cancellationToken);
        }

        var assigned = await db.UserRoles.AnyAsync(x => x.UserId == user.Id && x.RoleId == role.Id, cancellationToken);
        if (!assigned)
        {
            db.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            await db.SaveChangesAsync(cancellationToken);
        }
    }
}
