using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Admissions;

public sealed class AdmissionService(IAdmissionRepository repository, IStudentRepository studentRepository)
{
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

    public async Task<AdmissionDecision> DecideAsync(Guid admissionId, string decision, string? reason = null, string? decidedBy = null, CancellationToken cancellationToken = default)
    {
        var admission = await repository.GetAdmissionAsync(admissionId, cancellationToken)
            ?? throw new KeyNotFoundException("Admission was not found.");

        if (!string.Equals(decision, "Accepted", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(decision, "Rejected", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Decision must be Accepted or Rejected.", nameof(decision));

        admission.Status = decision.Equals("Accepted", StringComparison.OrdinalIgnoreCase) ? "Accepted" : "Rejected";
        admission.DecidedAt = DateTimeOffset.UtcNow;

        if (admission.Status == "Accepted")
        {
            var applicant = await repository.GetApplicantAsync(admission.ApplicantId, cancellationToken)
                ?? throw new KeyNotFoundException("Applicant was not found.");

            var yearId = admission.AcademicYearId.ToString("N");
            var guid = Guid.NewGuid().ToString("N");
            var studentNumber = $"STU-{yearId[..Math.Min(8, yearId.Length)]}-{guid[..Math.Min(6, guid.Length)]}";
            var student = new Student
            {
                StudentNumber = studentNumber,
                FirstName = applicant.FirstName,
                LastName = applicant.LastName,
                OtherNames = applicant.OtherNames,
                DateOfBirth = applicant.DateOfBirth,
                Gender = applicant.Gender,
                NationalId = applicant.NationalId,
                PhoneNumber = applicant.PhoneNumber,
                Email = applicant.Email,
                Status = "Active",
                AdmissionId = admission.Id
            };

            await studentRepository.AddAsync(student, cancellationToken);
            await studentRepository.SaveChangesAsync(cancellationToken);
        }

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
