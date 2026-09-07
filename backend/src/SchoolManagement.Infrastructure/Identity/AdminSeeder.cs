using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class AdminSeeder(SchoolManagementDbContext db, PasswordHasher hasher)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var roles = new[]
        {
            InstitutionalRoles.SystemAdministrator,
            InstitutionalRoles.Registrar,
            InstitutionalRoles.AcademicRegistrar,
            InstitutionalRoles.FinanceOfficer,
            InstitutionalRoles.Lecturer,
            InstitutionalRoles.ExaminationsOfficer,
            InstitutionalRoles.Student,
            InstitutionalRoles.StoreOfficer,
            InstitutionalRoles.HostelWarden,
            InstitutionalRoles.TransportOfficer,
            InstitutionalRoles.Principal,
            InstitutionalRoles.Secretary,
            InstitutionalRoles.ResidentDirector,
            InstitutionalRoles.HeadOfDepartment,
            InstitutionalRoles.AssistantPrincipal,
            InstitutionalRoles.Librarian,
            InstitutionalRoles.HrManager,
            InstitutionalRoles.Parent
        };

        foreach (var roleName in roles)
        {
            var role = await db.Roles.SingleOrDefaultAsync(x => x.Name == roleName, cancellationToken);
            if (role is null)
            {
                role = new Role
                {
                    Name = roleName,
                    Description = $"{roleName} role.",
                    IsSystemRole = true
                };
                db.Roles.Add(role);
            }
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
        }

        var adminRole = await db.Roles.SingleOrDefaultAsync(
            x => x.Name == InstitutionalRoles.SystemAdministrator,
            cancellationToken);
        if (adminRole is not null)
        {
            var assigned = await db.UserRoles.AnyAsync(
                x => x.UserId == admin.Id && x.RoleId == adminRole.Id,
                cancellationToken);
            if (!assigned)
            {
                db.UserRoles.Add(new UserRole { UserId = admin.Id, RoleId = adminRole.Id });
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }

    private static string GenerateRandomPassword()
    {
        var bytes = new byte[16];
        Random.Shared.NextBytes(bytes);
        return Convert.ToBase64String(bytes)[..22];
    }
}
