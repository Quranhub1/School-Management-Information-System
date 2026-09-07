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
            var password = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD")
                ?? GenerateRandomPassword();
            admin = new User
            {
                Username = "admin",
                PasswordHash = AuthService.HashPassword(password),
                FirstName = "System",
                LastName = "Administrator",
                Email = "admin@localhost",
                IsActive = true
            };
            db.Users.Add(admin);
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = role.Id });
            Console.WriteLine($"[IdentitySeeder] Generated admin credentials -> username: admin | password: {password}");
        }
        else if (!await db.UserRoles.AnyAsync(x => x.UserId == admin.Id && x.RoleId == role.Id, cancellationToken))
        {
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = role.Id });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateRandomPassword()
    {
        var bytes = new byte[16];
        Random.Shared.NextBytes(bytes);
        return Convert.ToBase64String(bytes)[..22];
    }
}
