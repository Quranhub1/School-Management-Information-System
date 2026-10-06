using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Inventory;

namespace SchoolManagement.Application.Inventory;

public sealed class SupplierService(
    ISupplierRepository supplierRepository)
{
    public Task<IReadOnlyList<Supplier>> GetSuppliersAsync(CancellationToken cancellationToken = default) =>
        supplierRepository.GetSuppliersAsync(cancellationToken);

    public Task<Supplier?> GetSupplierAsync(Guid id, CancellationToken cancellationToken = default) =>
        supplierRepository.GetSupplierAsync(id, cancellationToken);

    public async Task<Supplier> CreateSupplierAsync(
        string name,
        string? contactPerson,
        string? phone,
        string? email,
        string? address,
        string category,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Supplier name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(category)) throw new ArgumentException("Supplier category is required.", nameof(category));

        var supplier = new Supplier
        {
            Name = name.Trim(),
            ContactPerson = string.IsNullOrWhiteSpace(contactPerson) ? null : contactPerson.Trim(),
            Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim(),
            Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim(),
            Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim(),
            Category = category.Trim(),
            IsActive = isActive
        };

        await supplierRepository.AddAsync(supplier, cancellationToken);
        return supplier;
    }

    public async Task<Supplier> UpdateSupplierAsync(
        Guid id,
        string name,
        string? contactPerson,
        string? phone,
        string? email,
        string? address,
        string category,
        bool isActive,
        CancellationToken cancellationToken = default)
    {
        var existing = await supplierRepository.GetSupplierAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Supplier with ID {id} not found.");

        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Supplier name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(category)) throw new ArgumentException("Supplier category is required.", nameof(category));

        existing.Name = name.Trim();
        existing.ContactPerson = string.IsNullOrWhiteSpace(contactPerson) ? null : contactPerson.Trim();
        existing.Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
        existing.Email = string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        existing.Address = string.IsNullOrWhiteSpace(address) ? null : address.Trim();
        existing.Category = category.Trim();
        existing.IsActive = isActive;

        await supplierRepository.UpdateAsync(existing, cancellationToken);
        return existing;
    }

    public async Task DeleteSupplierAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var existing = await supplierRepository.GetSupplierAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Supplier with ID {id} not found.");

        await supplierRepository.DeleteAsync(id, cancellationToken);
    }
}