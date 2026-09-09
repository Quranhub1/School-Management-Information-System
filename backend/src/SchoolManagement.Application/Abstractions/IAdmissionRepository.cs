using SchoolManagement.Domain.Admissions;

namespace SchoolManagement.Application.Abstractions;

public interface IAdmissionRepository
{
    Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default);
    Task UpdateApplicantAsync(Applicant applicant, CancellationToken cancellationToken = default);
    Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Admission>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default);
    Task UpdateAdmissionAsync(Admission admission, CancellationToken cancellationToken = default);
    Task DeleteAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default);
    Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
