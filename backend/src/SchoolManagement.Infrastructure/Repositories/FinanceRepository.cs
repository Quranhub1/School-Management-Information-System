using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class FinanceRepository(SchoolManagementDbContext db) : IFinanceRepository
{
    public Task<StudentInvoice?> GetInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) =>
        db.StudentInvoices.FirstOrDefaultAsync(x => x.Id == invoiceId, cancellationToken);

    public async Task<IReadOnlyList<StudentInvoice>> GetStudentInvoicesAsync(Guid studentId, CancellationToken cancellationToken) =>
        await db.StudentInvoices.AsNoTracking().Where(x => x.StudentId == studentId).OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);

    public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) =>
        db.FeeStructures.AsNoTracking().FirstOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);

    public Task<bool> StudentExistsAsync(Guid studentId, CancellationToken cancellationToken) =>
        db.Students.AsNoTracking().AnyAsync(x => x.Id == studentId, cancellationToken);

    public Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, CancellationToken cancellationToken) =>
        db.StudentInvoices.AsNoTracking().AnyAsync(x => x.InvoiceNumber == invoiceNumber, cancellationToken);

    public Task<bool> ReceiptExistsAsync(string receiptNumber, CancellationToken cancellationToken) =>
        db.Payments.AsNoTracking().AnyAsync(x => x.ReceiptNumber == receiptNumber, cancellationToken);

    public async Task AddInvoiceAsync(StudentInvoice invoice, CancellationToken cancellationToken) =>
        await db.StudentInvoices.AddAsync(invoice, cancellationToken);

    public async Task AddPaymentAsync(Payment payment, CancellationToken cancellationToken) =>
        await db.Payments.AddAsync(payment, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => db.SaveChangesAsync(cancellationToken);
}
