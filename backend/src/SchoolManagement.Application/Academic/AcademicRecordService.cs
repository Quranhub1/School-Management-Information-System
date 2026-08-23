using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Academic;

public sealed class AcademicRecordService(IAcademicRecordRepository records)
{
    public Task<IReadOnlyList<TranscriptEntry>> GetTranscriptAsync(
        Guid studentId,
        Guid? academicYearId = null,
        Guid? semesterId = null,
        CancellationToken cancellationToken = default) =>
        records.GetTranscriptAsync(studentId, academicYearId, semesterId, cancellationToken);

    public Task<IReadOnlyList<AcademicResultSummary>> GetSummariesAsync(
        Guid studentId,
        CancellationToken cancellationToken = default) =>
        records.GetSummariesAsync(studentId, cancellationToken);

    public async Task<IReadOnlyList<TranscriptEntry>> GetOutstandingMissedPapersAsync(
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        var transcript = await records.GetTranscriptAsync(studentId, null, null, cancellationToken);
        return transcript.Where(x => x.Status == TranscriptStatus.Missed).ToList();
    }
}
