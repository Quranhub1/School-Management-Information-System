using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Abstractions;

public interface IAcademicRecordRepository
{
    Task<IReadOnlyList<TranscriptEntry>> GetTranscriptAsync(
        Guid studentId,
        Guid? academicYearId = null,
        Guid? semesterId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AcademicResultSummary>> GetSummariesAsync(
        Guid studentId,
        CancellationToken cancellationToken = default);
}
