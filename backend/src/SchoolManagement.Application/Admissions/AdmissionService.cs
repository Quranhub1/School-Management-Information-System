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

        if (status != null)
            admission.Status = status;

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

        if (admission.Status != "Pending")
            throw new InvalidOperationException($"Admission is already {admission.Status} and cannot be re-decided.");

        admission.Status = decision;
        admission.DecidedAt = DateTimeOffset.UtcNow;

        var applicant = await repository.GetApplicantAsync(admission.ApplicantId, cancellationToken)
            ?? throw new KeyNotFoundException("Applicant was not found.");

        // Keep the applicant lifecycle state synchronized with the admission decision.
        applicant.Status = decision == "Accepted" ? "Accepted" : "Rejected";

        // Enforce that mandatory admission requirements exist for the programme before
        // an applicant can be accepted. Requirements are defined per programme; without
        // at least one active requirement the programme is not ready to accept students.
        if (decision == "Accepted")
        {
            var requirements = await repository.GetAdmissionRequirementsAsync(
                admission.ProgrammeId, mandatoryOnly: true, cancellationToken);
            if (!requirements.Any())
                throw new InvalidOperationException("This programme has no active mandatory admission requirements configured. Configure requirements before accepting applicants.");
        }

        var result = new AdmissionDecision
        {
            AdmissionId = admission.Id,
            Decision = decision,
            Reason = reason,
            DecidedBy = decidedBy
        };

        await repository.AddDecisionAsync(result, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }
}
