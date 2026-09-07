using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class BankReconciliationRepository(SchoolManagementDbContext db) : IBankReconciliationRepository
{
    public async Task<IReadOnlyList<BankReconciliation>> GetAsync(Guid? bankAccountId, DateOnly? from, DateOnly? to, CancellationToken cancellationToken)
    {
        var query = db.BankReconciliations.AsNoTracking().AsQueryable();
        if (bankAccountId.HasValue) query = query.Where(x => x.BankAccountId == bankAccountId.Value);
        if (from.HasValue) query = query.Where(x => x.StatementDate >= from.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc));
        if (to.HasValue) query = query.Where(x => x.StatementDate <= to.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc));
        return await query.OrderByDescending(x => x.StatementDate).ToListAsync(cancellationToken);
    }

    public Task<BankReconciliation?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        db.BankReconciliations.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(BankReconciliation reconciliation, CancellationToken cancellationToken) =>
        await db.BankReconciliations.AddAsync(reconciliation, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
