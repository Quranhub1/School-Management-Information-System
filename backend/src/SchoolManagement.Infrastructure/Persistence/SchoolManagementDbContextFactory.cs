using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContextFactory : IDesignTimeDbContextFactory<SchoolManagementDbContext>
{
    public SchoolManagementDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
            ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT")
            ?? "Production";

        var configuration = new ConfigurationBuilder()
            .SetBasePath(AppContext.BaseDirectory)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("SchoolManagement")
            ?? configuration["ConnectionStrings:SchoolManagement"]
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__SchoolManagement")
            ?? throw new InvalidOperationException("Connection string 'SchoolManagement' is not configured. Set it in appsettings.json, appsettings.Production.json, or as an environment variable.");

        var optionsBuilder = new DbContextOptionsBuilder<SchoolManagementDbContext>();
        optionsBuilder.UseNpgsql(connectionString);
        return new SchoolManagementDbContext(optionsBuilder.Options);
    }
}
