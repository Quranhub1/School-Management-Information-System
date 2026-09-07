using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Finance;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class BudgetRepository(SchoolManagementDbContext db) : IBudgetRepository
{
    public async Task<IReadOnlyList<Budget>> GetAsync(Guid? academicYearId, bool activeOnly, CancellationToken cancellationToken)
    {
        var query = db.Budgets.AsNoTracking().Include(x => x.Lines).AsQueryable();
        if (academicYearId.HasValue) query = query.Where(x => x.AcademicYearId == academicYearId.Value);
        if (activeOnly) query = query.Where(x => x.IsActive);
        return await query.OrderByDescending(x => x.StartDate).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public Task<Budget?> GetAsync(Guid id, CancellationToken cancellationToken) =>
        db.Budgets.Include(x => x.Lines).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task AddAsync(Budget budget, CancellationToken cancellationToken) => await db.Budgets.AddAsync(budget, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
