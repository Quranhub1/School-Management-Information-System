using SchoolManagement.Application.Abstractions;

namespace SchoolManagement.Application.Assessment;

/// <summary>
/// Compatibility alias for assessment consumers that use the feature namespace.
/// The canonical repository contract lives in <see cref="SchoolManagement.Application.Abstractions.IAssessmentRepository"/>.
/// </summary>
public interface IAssessmentRepository : Abstractions.IAssessmentRepository
{
}
