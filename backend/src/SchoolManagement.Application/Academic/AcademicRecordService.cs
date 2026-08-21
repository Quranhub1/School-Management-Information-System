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
}
