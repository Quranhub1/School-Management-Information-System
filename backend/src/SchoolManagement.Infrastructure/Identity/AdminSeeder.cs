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

        var admin = await db.Users.SingleOrDefaultAsync(x => x.Username == "admin", cancellationToken);
        if (admin is null)
        {
            var password = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD")
                ?? GenerateRandomPassword();
            admin = new User
            {
                Username = "admin",
                PasswordHash = hasher.Hash(password),
                FirstName = "System",
                LastName = "Administrator",
                IsActive = true
            };
            db.Users.Add(admin);
            await db.SaveChangesAsync(cancellationToken);

            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = role.Id });
            await db.SaveChangesAsync(cancellationToken);

            Console.WriteLine($"[AdminSeeder] Generated admin credentials -> username: admin | password: {password}");
            try
            {
                await File.WriteAllTextAsync("/opt/schoolmanagement/ADMIN_CREDENTIALS.txt", $"username: admin\npassword: {password}\n", cancellationToken);
            }
            catch { /* ignore if path does not exist yet */ }
        }
        else if (!await db.UserRoles.AnyAsync(x => x.UserId == admin.Id && x.RoleId == role.Id, cancellationToken))
        {
            db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = role.Id });
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private static string GenerateRandomPassword()
    {
        var bytes = new byte[16];
        using var rng = Random.Shared;
        rng.NextBytes(bytes);
        return Convert.ToBase64String(bytes)[..22];
    }
}
