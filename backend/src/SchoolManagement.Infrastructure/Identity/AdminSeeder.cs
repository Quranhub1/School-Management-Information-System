using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using SchoolManagement.Application.Authorization;
using SchoolManagement.Domain.Administration;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class AdminSeeder(SchoolManagementDbContext db, PasswordHasher hasher, IHostEnvironment environment)
{
    private const string DevelopmentAdminPassword = "admin123";

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        var roles = new[]
        {
            InstitutionalRoles.SystemAdministrator,
            InstitutionalRoles.AcademicRegistrar,
            InstitutionalRoles.AssistantRegistrar,
            InstitutionalRoles.AdmissionsOfficer,
            InstitutionalRoles.Accountant,
            InstitutionalRoles.AssistantAccountant,
            InstitutionalRoles.Lecturer,
            InstitutionalRoles.ExaminationsOfficer,
            InstitutionalRoles.Student,
            InstitutionalRoles.StoreOfficer,
            InstitutionalRoles.HostelWarden,
            InstitutionalRoles.TransportOfficer,
            InstitutionalRoles.Principal,
            InstitutionalRoles.Director,
            InstitutionalRoles.Secretary,
            InstitutionalRoles.ResidentDirector,
            InstitutionalRoles.HeadOfDepartment,
            InstitutionalRoles.AssistantPrincipal,
            InstitutionalRoles.Receptionist,
            InstitutionalRoles.Librarian,
            InstitutionalRoles.HrManager,
            InstitutionalRoles.AdminSecretary,
            InstitutionalRoles.RecordsOfficer
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

        var institution = await db.InstitutionSettings
            .SingleOrDefaultAsync(x => x.IsActive, cancellationToken);
        if (institution is null)
        {
            db.InstitutionSettings.Add(new InstitutionSettings
            {
                InstitutionName = "Institution Management System",
                Abbreviation = "SMIS",
                InstitutionType = "School",
                PrimaryColor = "#1e40af",
                AccentColor = "#f97316",
                IsActive = true,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync(cancellationToken);
        }

        var admin = await db.Users.SingleOrDefaultAsync(x => x.Username == "admin", cancellationToken);
        if (admin is null)
        {
            var password = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD");
            if (environment.IsProduction())
            {
                if (string.IsNullOrWhiteSpace(password) || password.Length < 12)
                    throw new InvalidOperationException("SEED_ADMIN_PASSWORD must be configured with at least 12 characters before the production admin account can be seeded.");
            }
            else
            {
                password ??= DevelopmentAdminPassword;
            }

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
}