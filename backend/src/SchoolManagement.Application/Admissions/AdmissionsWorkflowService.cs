using SchoolManagement.Domain.Admissions;
using SchoolManagement.Application.Abstractions;

namespace SchoolManagement.Application.Admissions;

public sealed class AdmissionsWorkflowService(AdmissionService admissionService)
{
    public async Task<IReadOnlyList<AdmissionDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var admissions = await admissionService.GetAllAsync(cancellationToken);
        return admissions.Select(ToDto).ToList();
    }

    public async Task<AdmissionDto?> GetByIdAsync(Guid admissionId, CancellationToken cancellationToken = default)
    {
        var admission = await admissionService.GetByIdAsync(admissionId, cancellationToken);
        return admission is null ? null : ToDto(admission);
    }

    public async Task<AdmissionDto> CreateAsync(CreateAdmissionRequest request, CancellationToken cancellationToken = default)
    {
        var admission = await admissionService.CreateAsync(
            request.ApplicantId,
            request.ProgrammeId,
            request.AcademicYearId,
            request.IntakeId,
            cancellationToken);

        return ToDto(admission);
    }

    public async Task<AdmissionDto?> UpdateAsync(Guid admissionId, UpdateAdmissionRequest request, CancellationToken cancellationToken = default)
    {
        var admission = await admissionService.UpdateAsync(admissionId, request.Status, cancellationToken);
        return admission is null ? null : ToDto(admission);
    }

    public async Task<bool> DeleteAsync(Guid admissionId, CancellationToken cancellationToken = default)
    {
        return await admissionService.DeleteAsync(admissionId, cancellationToken);
    }

    public async Task<AdmissionDecisionDto> DecideAsync(
        Guid admissionId,
        DecideAdmissionRequest request,
        CancellationToken cancellationToken = default)
    {
        var decision = await admissionService.DecideAsync(
            admissionId,
            request.Decision,
            request.Reason,
            request.DecidedBy,
            cancellationToken);

        return new AdmissionDecisionDto(
            decision.Id,
            decision.AdmissionId,
            decision.Decision,
            decision.Reason,
            decision.DecidedBy);
    }

    private static AdmissionDto ToDto(Admission admission) => new(
        admission.Id,
        admission.ApplicantId,
        admission.ProgrammeId,
        admission.AcademicYearId,
        admission.IntakeId,
        admission.Status,
        admission.DecidedAt);
}
