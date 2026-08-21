using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AcademicRecordRepository(SchoolManagementDbContext db) : IAcademicRecordRepository
{
    public async Task<IReadOnlyList<TranscriptEntry>> GetTranscriptAsync(
        Guid studentId,
        Guid? academicYearId = null,
        Guid? semesterId = null,
        CancellationToken cancellationToken = default)
    {
        var query = db.TranscriptEntries
            .AsNoTracking()
            .Where(x => x.StudentId == studentId);

        if (academicYearId.HasValue)
            query = query.Where(x => x.AcademicYearId == academicYearId.Value);

        if (semesterId.HasValue)
            query = query.Where(x => x.SemesterId == semesterId.Value);

        return await query
            .OrderBy(x => x.AcademicYearId)
            .ThenBy(x => x.SemesterId)
            .ThenBy(x => x.CourseCode)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AcademicResultSummary>> GetSummariesAsync(
        Guid studentId,
        CancellationToken cancellationToken = default) =>
        await db.AcademicResultSummaries
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderBy(x => x.AcademicYearId)
            .ThenBy(x => x.SemesterId)
            .ToListAsync(cancellationToken);
}
