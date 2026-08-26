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
        await db.StudentInvoices.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.IssuedAt)
            .ToListAsync(cancellationToken);

    public Task<FeeStructure?> GetActiveFeeStructureAsync(Guid feeStructureId, CancellationToken cancellationToken) =>
        db.FeeStructures.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == feeStructureId && x.IsActive, cancellationToken);

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

    public async Task<IReadOnlyList<Payment>> GetPaymentsAsync(
        string? receiptNumber = null,
        string? paymentMethod = null,
        DateOnly? from = null,
        DateOnly? to = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.Payments.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(receiptNumber))
            query = query.Where(p => p.ReceiptNumber.Contains(receiptNumber.Trim()));

        if (!string.IsNullOrWhiteSpace(paymentMethod))
            query = query.Where(p => p.PaymentMethod == paymentMethod.Trim());

        if (from.HasValue)
            query = query.Where(p => p.PaidAt.Date >= from.Value.ToDateTime(TimeOnly.MinValue));

        if (to.HasValue)
            query = query.Where(p => p.PaidAt.Date <= to.Value.ToDateTime(TimeOnly.MaxValue));

        return await query
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);

    public async Task<IReadOnlyList<FeeStructure>> GetFeeStructuresAsync(Guid? academicYearId = null, CancellationToken cancellationToken = default)
    {
        var query = db.FeeStructures.AsNoTracking().AsQueryable();
        if (academicYearId.HasValue)
            query = query.Where(x => x.AcademicYearId == academicYearId.Value);
        return await query.OrderByDescending(x => x.IsActive).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public async Task AddFeeStructureAsync(FeeStructure feeStructure, CancellationToken cancellationToken) =>
        await db.FeeStructures.AddAsync(feeStructure, cancellationToken);

    public Task UpdateFeeStructureAsync(FeeStructure feeStructure, CancellationToken cancellationToken)
    {
        db.FeeStructures.Update(feeStructure);
        return Task.CompletedTask;
    }

    public Task<Sponsorship?> GetSponsorshipAsync(Guid sponsorshipId, CancellationToken cancellationToken) =>
        db.Sponsorships.AsNoTracking().FirstOrDefaultAsync(x => x.Id == sponsorshipId, cancellationToken);

    public async Task<IReadOnlyList<Sponsorship>> GetSponsorshipsAsync(Guid? studentId = null, CancellationToken cancellationToken = default)
    {
        var query = db.Sponsorships.AsNoTracking().AsQueryable();
        if (studentId.HasValue)
            query = query.Where(x => x.StudentId == studentId.Value);
        return await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
    }

    public async Task AddSponsorshipAsync(Sponsorship sponsorship, CancellationToken cancellationToken) =>
        await db.Sponsorships.AddAsync(sponsorship, cancellationToken);

    public Task UpdateSponsorshipAsync(Sponsorship sponsorship, CancellationToken cancellationToken)
    {
        db.Sponsorships.Update(sponsorship);
        return Task.CompletedTask;
    }

    public Task<InstalmentPlan?> GetInstalmentPlanAsync(Guid instalmentPlanId, CancellationToken cancellationToken) =>
        db.InstalmentPlans.AsNoTracking().FirstOrDefaultAsync(x => x.Id == instalmentPlanId, cancellationToken);

    public async Task<IReadOnlyList<InstalmentPlan>> GetInstalmentPlansAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await db.InstalmentPlans.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task AddInstalmentPlanAsync(InstalmentPlan plan, CancellationToken cancellationToken) =>
        await db.InstalmentPlans.AddAsync(plan, cancellationToken);

    public async Task AddInstalmentPaymentAsync(InstalmentPayment payment, CancellationToken cancellationToken) =>
        await db.InstalmentPayments.AddAsync(payment, cancellationToken);

    public async Task<IReadOnlyList<InstalmentPayment>> GetInstalmentPaymentsAsync(Guid instalmentPlanId, CancellationToken cancellationToken = default) =>
        await db.InstalmentPayments.AsNoTracking()
            .Where(x => x.InstalmentPlanId == instalmentPlanId)
            .OrderBy(x => x.InstalmentNumber)
            .ToListAsync(cancellationToken);

    public Task UpdateInstalmentPaymentAsync(InstalmentPayment payment, CancellationToken cancellationToken)
    {
        db.InstalmentPayments.Update(payment);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<StudentInvoice>> GetOutstandingInvoicesAsync(Guid? programmeId = null, Guid? academicYearId = null, CancellationToken cancellationToken = default)
    {
        var query = db.StudentInvoices.AsNoTracking()
            .Where(x => x.PaidAmount < x.Amount)
            .AsQueryable();

        if (programmeId.HasValue)
        {
            query = query.Where(x => x.FeeStructure.ProgrammeId == programmeId.Value);
        }

        if (academicYearId.HasValue)
        {
            query = query.Where(x => x.FeeStructure.AcademicYearId == academicYearId.Value);
        }

        return await query.OrderByDescending(x => x.IssuedAt).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<MobileMoneyTransaction>> GetMobileMoneyTransactionsAsync(string? status = null, CancellationToken cancellationToken = default)
    {
        var query = db.MobileMoneyTransactions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(x => x.Status == status.Trim());
        return await query.OrderByDescending(x => x.RequestedAt).ToListAsync(cancellationToken);
    }

    public async Task AddMobileMoneyTransactionAsync(MobileMoneyTransaction transaction, CancellationToken cancellationToken) =>
        await db.MobileMoneyTransactions.AddAsync(transaction, cancellationToken);

    public Task UpdateMobileMoneyTransactionAsync(MobileMoneyTransaction transaction, CancellationToken cancellationToken)
    {
        db.MobileMoneyTransactions.Update(transaction);
        return Task.CompletedTask;
    }

    public Task<DailyCollection?> GetDailyCollectionAsync(Guid collectionId, CancellationToken cancellationToken) =>
        db.DailyCollections.AsNoTracking().FirstOrDefaultAsync(x => x.Id == collectionId, cancellationToken);

    public async Task<IReadOnlyList<DailyCollection>> GetDailyCollectionsAsync(DateOnly? from = null, DateOnly? to = null, CancellationToken cancellationToken = default)
    {
        var query = db.DailyCollections.AsNoTracking().AsQueryable();
        if (from.HasValue)
            query = query.Where(x => x.CollectionDate >= from.Value);
        if (to.HasValue)
            query = query.Where(x => x.CollectionDate <= to.Value);
        return await query.OrderByDescending(x => x.CollectionDate).ToListAsync(cancellationToken);
    }

    public async Task AddDailyCollectionAsync(DailyCollection collection, CancellationToken cancellationToken) =>
        await db.DailyCollections.AddAsync(collection, cancellationToken);

    public Task UpdateDailyCollectionAsync(DailyCollection collection, CancellationToken cancellationToken)
    {
        db.DailyCollections.Update(collection);
        return Task.CompletedTask;
    }

    public async Task AddDailyCollectionPaymentAsync(DailyCollectionPayment payment, CancellationToken cancellationToken) =>
        await db.DailyCollectionPayments.AddAsync(payment, cancellationToken);

    public async Task<IReadOnlyList<DailyCollectionPayment>> GetDailyCollectionPaymentsAsync(Guid dailyCollectionId, CancellationToken cancellationToken = default) =>
        await db.DailyCollectionPayments.AsNoTracking()
            .Where(x => x.DailyCollectionId == dailyCollectionId)
            .OrderByDescending(x => x.Id)
            .ToListAsync(cancellationToken);
}
