using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class FeeRepository(SchoolManagementDbContext db) : IFeeRepository
{
    public Task<FeeStructure?> GetFeeStructureAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.FeeStructures.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<StudentInvoice?> GetInvoiceAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.StudentInvoices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken = default) =>
        await db.StudentInvoices.AddAsync(invoice, cancellationToken);

    public async Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken = default) =>
        await db.Payments.AddAsync(payment, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
