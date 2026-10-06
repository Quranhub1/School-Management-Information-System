using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Infrastructure.Inventory;

public sealed class SupplierRepository(SchoolManagementDbContext db) : ISupplierRepository
{
    public async Task<IReadOnlyList<Supplier>> GetSuppliersAsync(CancellationToken cancellationToken = default) =>
        await db.Set<Supplier>().AsNoTracking().ToListAsync(cancellationToken);

    public Task<Supplier?> GetSupplierAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<Supplier>().AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(Supplier entity, CancellationToken cancellationToken = default) =>
        db.Set<Supplier>().AddAsync(entity, cancellationToken).AsTask();

    public Task UpdateAsync(Supplier entity, CancellationToken cancellationToken = default)
    {
        db.Set<Supplier>().Update(entity);
        return db.SaveChangesAsync(cancellationToken);
    }

    public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        db.Set<Supplier>().Remove(new Supplier { Id = id });
        return db.SaveChangesAsync(cancellationToken);
    }
}