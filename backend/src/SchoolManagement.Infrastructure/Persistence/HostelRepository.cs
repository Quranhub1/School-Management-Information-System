using Microsoft.EntityFrameworkCore;
using Npgsql;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Hostel;

namespace SchoolManagement.Infrastructure.Persistence;

public sealed class HostelRepository(SchoolManagementDbContext db) : IHostelRepository
{
    public async Task<IReadOnlyList<Hostel>> GetHostelsAsync(CancellationToken cancellationToken = default) =>
        await db.Set<Hostel>()
            .Where(h => h.IsActive)
            .Include(h => h.Rooms.Where(r => r.IsActive))
            .ThenInclude(r => r.Beds.Where(b => b.IsActive))
            .ThenInclude(b => b.Allocations)
            .ThenInclude(a => a.Semester)
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync(cancellationToken);

    public Task<Hostel?> GetHostelAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Set<Hostel>().Include(h => h.Rooms).ThenInclude(r => r.Beds).ThenInclude(b => b.Allocations)
            .FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
    public Task<HostelRoom?> GetRoomAsync(Guid id, CancellationToken cancellationToken = default) => db.Set<HostelRoom>().Include(r => r.Beds).FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    public Task<HostelBed?> GetBedAsync(Guid id, CancellationToken cancellationToken = default) => db.Set<HostelBed>().FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    public Task<HostelAllocation?> GetAllocationAsync(Guid id, CancellationToken cancellationToken = default) => db.Set<HostelAllocation>().FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    public Task<HostelAllocation?> GetActiveAllocationByBedAsync(Guid bedId, Guid semesterId, CancellationToken cancellationToken = default) => db.Set<HostelAllocation>().FirstOrDefaultAsync(a => a.BedId == bedId && a.SemesterId == semesterId && a.Status == "Active", cancellationToken);
    public Task<HostelAllocation?> GetActiveAllocationByStudentAsync(Guid studentId, Guid semesterId, CancellationToken cancellationToken = default) => db.Set<HostelAllocation>().FirstOrDefaultAsync(a => a.StudentId == studentId && a.SemesterId == semesterId && a.Status == "Active", cancellationToken);
    public Task<SchoolManagement.Domain.Academic.Semester?> GetSemesterForDateAsync(DateOnly date, CancellationToken cancellationToken = default) =>
        (from semester in db.Semesters.AsNoTracking()
         join year in db.AcademicYears.AsNoTracking() on semester.AcademicYearId equals year.Id
         where semester.IsActive && year.IsActive && semester.StartDate <= date && semester.EndDate >= date
         orderby semester.StartDate descending
         select semester).FirstOrDefaultAsync(cancellationToken);
    public async Task ExpireEndedSemesterAllocationsAsync(DateOnly today, CancellationToken cancellationToken = default)
    {
        var expired = await (from allocation in db.HostelAllocations
            join semester in db.Semesters on allocation.SemesterId equals semester.Id
            where allocation.Status == "Active" && allocation.SemesterId != null && semester.EndDate < today
            select new { Allocation = allocation, SemesterEnd = semester.EndDate }).ToListAsync(cancellationToken);
        foreach (var row in expired)
        {
            row.Allocation.Status = "Completed";
            row.Allocation.EndDate = row.SemesterEnd;
        }
        if (expired.Count > 0) await db.SaveChangesAsync(cancellationToken);
    }
    public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class => db.Set<T>().AddAsync(entity, cancellationToken).AsTask();
    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation } pg && (pg.ConstraintName == "UX_HostelAllocations_ActiveBed" || pg.ConstraintName == "UX_HostelAllocations_ActiveStudent"))
        { throw new InvalidOperationException("The hostel allocation conflicts with an existing active allocation.", ex); }
    }
}
