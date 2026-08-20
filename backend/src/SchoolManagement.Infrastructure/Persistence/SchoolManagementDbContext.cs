using Microsoft.EntityFrameworkCore;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class SchoolManagementDbContext(DbContextOptions<SchoolManagementDbContext> options)
    : DbContext(options)
{
}
