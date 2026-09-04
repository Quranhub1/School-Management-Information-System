using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Application.Tests.Assessment;

public sealed class AssessmentWorkflowServiceTests
{
    [Fact]
    public async Task RecordBatchAsync_RejectsScoreAboveMaximum()
    {
        var repository = new InMemoryAssessmentRepository();
        var service = new AssessmentWorkflowService(repository);
        var command = new RecordAssessmentCommand(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), 101m, 100m, null);
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => service.RecordBatchAsync([command]));
    }

    private sealed class InMemoryAssessmentRepository : global::SchoolManagement.Application.Assessment.IAssessmentRepository
    {
        public Task<IReadOnlyList<AssessmentPlan>> GetPlansAsync(Guid? courseId = null, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AssessmentPlan>>([]);
        public Task<IReadOnlyList<StudentAssessment>> GetStudentAssessmentsAsync(Guid courseRegistrationId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<StudentAssessment>>([]);
        public Task<StudentAssessment> AddStudentAssessmentAsync(StudentAssessment assessment, CancellationToken cancellationToken = default) => Task.FromResult(assessment);
    }
}
