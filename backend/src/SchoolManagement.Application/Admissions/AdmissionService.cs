using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Admissions;

namespace SchoolManagement.Application.Admissions;

public sealed class AdmissionService(IAdmissionRepository repository)
{
    public async Task<IReadOnlyList<Admission>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await repository.GetAllAsync(cancellationToken);

    public async Task<Admission?> GetByIdAsync(Guid admissionId, CancellationToken cancellationToken = default) =>
        await repository.GetAdmissionAsync(admissionId, cancellationToken);

    public async Task<Admission> CreateAsync(Guid applicantId, Guid programmeId, Guid academicYearId, Guid intakeId, CancellationToken cancellationToken = default)
    {
        if (await repository.GetApplicantAsync(applicantId, cancellationToken) is null)
            throw new KeyNotFoundException("Applicant was not found.");

        var admission = new Admission
        {
            ApplicantId = applicantId,
            ProgrammeId = programmeId,
            AcademicYearId = academicYearId,
            IntakeId = intakeId,
            Status = "Pending"
        };

        await repository.AddAdmissionAsync(admission, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return admission;
    }

    public async Task<Admission?> UpdateAsync(Guid admissionId, string? status = null, CancellationToken cancellationToken = default)
    {
        var admission = await repository.GetAdmissionAsync(admissionId, cancellationToken);
        if (admission is null) return null;

        if (!string.IsNullOrWhiteSpace(status))
            admission.Status = status.Trim();

        await repository.UpdateAdmissionAsync(admission, cancellationToken);
        return admission;
    }

    public async Task<bool> DeleteAsync(Guid admissionId, CancellationToken cancellationToken = default)
    {
        var admission = await repository.GetAdmissionAsync(admissionId, cancellationToken);
        if (admission is null) return false;

        await repository.DeleteAdmissionAsync(admissionId, cancellationToken);
        return true;
    }

    public async Task<AdmissionDecision> DecideAsync(Guid admissionId, string decision, string? reason = null, string? decidedBy = null, CancellationToken cancellationToken = default)
    {
        var admission = await repository.GetAdmissionAsync(admissionId, cancellationToken)
            ?? throw new KeyNotFoundException("Admission was not found.");

        if (!string.Equals(decision, "Accepted", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Decision must be Accepted or Rejected.", nameof(decision));

        admission.Status = decision.Equals("Accepted", StringComparison.OrdinalIgnoreCase) ? "Accepted" : "Rejected";
        admission.DecidedAt = DateTimeOffset.UtcNow;

        var result = new AdmissionDecision
        {
            AdmissionId = admission.Id,
            Decision = admission.Status,
            Reason = reason,
            DecidedBy = decidedBy
        };

        await repository.AddDecisionAsync(result, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
