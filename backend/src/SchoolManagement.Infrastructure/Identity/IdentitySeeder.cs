using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Identity;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

public sealed class IdentitySeeder(SchoolManagementDbContext db)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        // Existing seeding logic remains in the repository's current implementation.
        await Task.CompletedTask;
    }

    private static string GenerateRandomPassword()
    {
        var bytes = new byte[16];
        Random.Shared.NextBytes(bytes);
        return Convert.ToBase64String(bytes)[..22];
    }
}
