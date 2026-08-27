using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContextFactory : IDesignTimeDbContextFactory<SchoolManagementDbContext>
{
    public SchoolManagementDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__SchoolManagement")
            ?? "Host=localhost;Port=5432;Database=school_management;Username=postgres;Password=postgres";
        var optionsBuilder = new DbContextOptionsBuilder<SchoolManagementDbContext>();
        optionsBuilder.UseNpgsql(connectionString);
        return new SchoolManagementDbContext(optionsBuilder.Options);
    }
}
