using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authentication;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public static class IdentitySeeder
{
    public static async Task SeedAsync(SchoolManagementDbContext db, CancellationToken cancellationToken = default)
    {
        const string roleName = InstitutionalRoles.SystemAdministrator;
        var role = await db.Roles.SingleOrDefaultAsync(x => x.Name == roleName, cancellationToken);
        if (role is null)
        {
            role = new Role { Name = roleName, Description = "Full system administration access", IsSystemRole = true };
            db.Roles.Add(role);
        }

        var admin = await db.Users.SingleOrDefaultAsync(x => x.Username == "admin", cancellationToken);
        if (admin is null)
        {
            admin = new User
            {
                Username = "admin",
                PasswordHash = AuthService.HashPassword("admin123"),
                FirstName = "System",
                LastName = "Administrator",
                Email = "admin@localhost",
                IsActive = true
            };
            db.Users.Add(admin);
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = role.Id });
        }
        else if (!await db.UserRoles.AnyAsync(x => x.UserId == admin.Id && x.RoleId == role.Id, cancellationToken))
        {
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = role.Id });
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
