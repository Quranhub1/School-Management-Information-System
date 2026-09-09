using SchoolManagement.Domain.Assessment;

namespace SchoolManagement.Application.Abstractions;

public interface IAssessmentRepository
{
    Task<IReadOnlyList<AssessmentPlan>> GetPlansAsync(Guid? courseId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentAssessment>> GetStudentAssessmentsAsync(Guid courseRegistrationId, CancellationToken cancellationToken = default);
    Task<StudentAssessment?> GetStudentAssessmentByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<StudentAssessment> AddStudentAssessmentAsync(StudentAssessment assessment, CancellationToken cancellationToken = default);
}
