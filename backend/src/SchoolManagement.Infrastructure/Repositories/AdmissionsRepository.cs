using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

/// <summary>
/// Backwards-compatible plural alias for the canonical admission repository.
/// </summary>
public sealed class AdmissionsRepository(SchoolManagementDbContext db) : IAdmissionRepository
{
    private readonly AdmissionRepository inner = new(db);

    public Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default) => inner.GetApplicantAsync(applicantId, cancellationToken);
    public Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default) => inner.GetAdmissionAsync(admissionId, cancellationToken);
    public Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default) => inner.AddAdmissionAsync(admission, cancellationToken);
    public Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default) => inner.AddDecisionAsync(decision, cancellationToken);
    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => inner.SaveChangesAsync(cancellationToken);
}
