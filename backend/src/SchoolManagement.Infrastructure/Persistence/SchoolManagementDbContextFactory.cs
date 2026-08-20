using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContextFactory : IDesignTimeDbContextFactory<SchoolManagementDbContext>
{
    public SchoolManagementDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SchoolManagementDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=postgres");
        return new SchoolManagementDbContext(optionsBuilder.Options);
    }
}
