using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Identity;

/// <summary>
/// Keeps the persisted permission catalogue and role defaults aligned with the
/// canonical catalogue. Permission groups are display-only; every permission
/// remains independently assignable.
/// </summary>
public sealed class PermissionCatalogSeeder(SchoolManagementDbContext db)
{
    public Task SeedAsync(CancellationToken cancellationToken = default)
        => PermissionCatalog.SeedAsync(db, cancellationToken);
}
