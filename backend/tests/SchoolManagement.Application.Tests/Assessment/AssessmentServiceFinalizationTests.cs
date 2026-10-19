using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Assessment;
using SchoolManagement.Domain.Assessment;
using Xunit;

namespace SchoolManagement.Application.Tests.Assessment;

public sealed class AssessmentServiceFinalizationTests
{
    [Fact]
    public async Task FinalizeStudentAssessmentAsync_FinalizesAndReturnsThePersistedRecord()
    {
        var assessment = new StudentAssessment
        {
            StudentId = Guid.NewGuid(),
            CourseRegistrationId = Guid.NewGuid(),
            AssessmentPlanId = Guid.NewGuid(),
            Score = 78m,
            MaximumScore = 100m
        };
        var repository = new FakeRepository(assessment);
        var service = new AssessmentService(repository);

        var finalized = await service.FinalizeStudentAssessmentAsync(assessment.Id);

        Assert.NotNull(finalized);
        Assert.True(finalized!.IsFinalized);
        Assert.Equal(1, repository.FinalizeCalls);
    }

    [Fact]
    public async Task FinalizeStudentAssessmentAsync_RejectsAlreadyFinalizedRecord()
    {
        var assessment = new StudentAssessment
        {
            StudentId = Guid.NewGuid(),
            CourseRegistrationId = Guid.NewGuid(),
            AssessmentPlanId = Guid.NewGuid(),
            Score = 78m,
            MaximumScore = 100m,
            IsFinalized = true
        };
        var repository = new FakeRepository(assessment);
        var service = new AssessmentService(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.FinalizeStudentAssessmentAsync(assessment.Id));
        Assert.Equal(0, repository.FinalizeCalls);
    }

    private sealed class FakeRepository(StudentAssessment assessment) : IAssessmentRepository
    {
        public int FinalizeCalls { get; private set; }

        public Task<IReadOnlyList<AssessmentPlan>> GetPlansAsync(Guid? courseId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AssessmentPlan>>([]);

        public Task<IReadOnlyList<StudentAssessment>> GetStudentAssessmentsAsync(Guid courseRegistrationId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<StudentAssessment>>([]);

        public Task<StudentAssessment?> GetStudentAssessmentByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<StudentAssessment?>(assessment.Id == id ? assessment : null);

        public Task<StudentAssessment> AddStudentAssessmentAsync(StudentAssessment value, CancellationToken cancellationToken = default) =>
            Task.FromResult(value);

        public Task<bool> FinalizeStudentAssessmentAsync(Guid id, CancellationToken cancellationToken = default)
        {
            FinalizeCalls++;
            if (assessment.Id != id || assessment.IsFinalized) return Task.FromResult(false);
            assessment.IsFinalized = true;
            return Task.FromResult(true);
        }
    }
}
