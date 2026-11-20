using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AcademicYearRepository(SchoolManagementDbContext db) : IAcademicYearRepository
{
    public async Task<IReadOnlyList<AcademicYear>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        // Extend the seeded academic-year catalogue as time moves forward.
        // The generated range starts at 2001-2002 and always reaches 100 years
        // beyond the current year, with an idempotent insert.
        var lastYear = DateTime.UtcNow.Year + 100;
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "AcademicYears"
                ("Id", "Name", "StartDate", "EndDate", "IsCurrent", "IsActive")
            SELECT gen_random_uuid(),
                   year_value::text || '-' || (year_value + 1)::text,
                   make_date(year_value, 1, 1),
                   make_date(year_value + 1, 1, 1) - 1,
                   FALSE,
                   TRUE
            FROM generate_series(2001, {lastYear}) AS years(year_value)
            WHERE NOT EXISTS (
                SELECT 1 FROM "AcademicYears" existing
                WHERE existing."Name" = year_value::text || '-' || (year_value + 1)::text
            );
            """, cancellationToken);

        return await db.AcademicYears.AsNoTracking()
            .OrderByDescending(x => x.StartDate)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<AcademicYear?> GetByIdAsync(Guid id, bool tracked = false, CancellationToken cancellationToken = default) =>
        (tracked ? db.AcademicYears : db.AcademicYears.AsNoTracking()).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> NameExistsAsync(string name, Guid? excludingId = null, CancellationToken cancellationToken = default) =>
        db.AcademicYears.AnyAsync(x => x.Name == name && (!excludingId.HasValue || x.Id != excludingId.Value), cancellationToken);

    public Task AddAsync(AcademicYear academicYear, CancellationToken cancellationToken = default) =>
        db.AcademicYears.AddAsync(academicYear, cancellationToken).AsTask();

    public async Task SetCurrentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await db.AcademicYears.Where(x => x.IsCurrent && x.Id != id).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCurrent, false), cancellationToken);
        await db.AcademicYears.Where(x => x.Id == id).ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCurrent, true), cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
