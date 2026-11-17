using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Domain.Admissions;
using Xunit;

namespace SchoolManagement.Application.Tests.Admissions;

public sealed class AdmissionServiceTests
{
    [Fact]
    public async Task CreateAsync_CreatesAdmissionWithPendingStatus()
    {
        var repo = new FakeAdmissionRepository();
        var service = new AdmissionService(repo);

        var admission = await service.CreateAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        Assert.Equal("Pending", admission.Status);
        Assert.Single(repo.Admissions);
    }

    [Fact]
    public async Task CreateAsync_RejectsUnknownApplicant()
    {
        var repo = new FakeAdmissionRepository(applicantExists: false);
        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithMandatoryRequirements_SetsStatusAndApplicant()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var programmeId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = programmeId, AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId };
        await repo.AddAdmissionAsync(admission);
        repo.AddApplicant(admission.ApplicantId);
        repo.AddRequirement(programmeId, "Birth certificate", "Birth certificate", isMandatory: true);

        var service = new AdmissionService(repo);
        var decision = await service.DecideAsync(admission.Id, "Accepted", "Met all requirements", "registrar");

        Assert.Equal("Accepted", admission.Status);
        Assert.Equal("Accepted", repo.Applicants[admission.ApplicantId].Status);
        Assert.Equal("Accepted", decision.Decision);
        Assert.Equal("Met all requirements", decision.Reason);
        Assert.Equal("registrar", decision.DecidedBy);
        Assert.NotNull(admission.DecidedAt);
    }

    [Fact]
    public async Task DecideAsync_Rejected_SetsStatusAndApplicant()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId };
        await repo.AddAdmissionAsync(admission);
        repo.AddApplicant(admission.ApplicantId);

        var service = new AdmissionService(repo);
        var decision = await service.DecideAsync(admission.Id, "Rejected", "Incomplete documents", "registrar");

        Assert.Equal("Rejected", admission.Status);
        Assert.Equal("Rejected", repo.Applicants[admission.ApplicantId].Status);
        Assert.Equal("Rejected", decision.Decision);
        Assert.Equal("Incomplete documents", decision.Reason);
        Assert.NotNull(admission.DecidedAt);
    }

    [Fact]
    public async Task DecideAsync_RejectsNonPendingAdmission()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId, Status = "Accepted" };
        await repo.AddAdmissionAsync(admission);

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, "Rejected"));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithoutMandatoryRequirements_Throws()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId };
        await repo.AddAdmissionAsync(admission);
        repo.AddApplicant(admission.ApplicantId);
        // No mandatory requirements added for this programme

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, "Accepted"));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithOnlyOptionalRequirements_Throws()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var programmeId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = programmeId, AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId };
        await repo.AddAdmissionAsync(admission);
        repo.AddApplicant(admission.ApplicantId);
        repo.AddRequirement(programmeId, "Optional document", "Optional document", isMandatory: false);

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, "Accepted"));
    }

    [Fact]
    public async Task UpdateAsync_ChangesStatus()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId };
        await repo.AddAdmissionAsync(admission);

        var service = new AdmissionService(repo);
        var updated = await service.UpdateAsync(admission.Id, "Rejected");

        Assert.NotNull(updated);
        Assert.Equal("Rejected", updated.Status);
    }

    [Fact]
    public async Task UpdateAsync_UnknownAdmission_ReturnsNull()
    {
        var repo = new FakeAdmissionRepository();
        var service = new AdmissionService(repo);

        var updated = await service.UpdateAsync(Guid.NewGuid(), "Rejected");

        Assert.Null(updated);
    }

    [Fact]
    public async Task DeleteAsync_RemovesAdmission()
    {
        var repo = new FakeAdmissionRepository();
        var admissionId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Id = admissionId };
        await repo.AddAdmissionAsync(admission);

        var service = new AdmissionService(repo);
        var result = await service.DeleteAsync(admission.Id);

        Assert.True(result);
        Assert.Empty(repo.Admissions);
    }

    [Fact]
    public async Task DeleteAsync_UnknownAdmission_ReturnsFalse()
    {
        var repo = new FakeAdmissionRepository();
        var service = new AdmissionService(repo);

        var result = await service.DeleteAsync(Guid.NewGuid());

        Assert.False(result);
    }

    private sealed class FakeAdmissionRepository : IAdmissionRepository
    {
        private readonly Dictionary<Guid, Admission> _admissions = new();
        private readonly Dictionary<Guid, Applicant> _applicants = new();
        private readonly List<AdmissionRequirement> _requirements = new();
        private readonly bool _applicantExists;

        public FakeAdmissionRepository(bool applicantExists = true) => _applicantExists = applicantExists;

        public IReadOnlyList<Admission> Admissions => _admissions.Values.ToList();
        public Dictionary<Guid, Applicant> Applicants => _applicants;

        public Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_applicantExists && _applicants.TryGetValue(applicantId, out var applicant) ? applicant : null);

        public Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_admissions.TryGetValue(admissionId, out var admission) ? admission : null);

        public Task<IReadOnlyList<Admission>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Admission>>(_admissions.Values.ToList());

        public Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
        {
            _admissions[admission.Id] = admission;
            return Task.CompletedTask;
        }

        public Task AddAdmissionAsync(Guid applicantId, Guid programmeId, Guid academicYearId, Guid intakeId, CancellationToken cancellationToken = default)
        {
            var admission = new Admission { ApplicantId = applicantId, ProgrammeId = programmeId, AcademicYearId = academicYearId, IntakeId = intakeId };
            _admissions[admission.Id] = admission;
            return Task.CompletedTask;
        }

        public Task AddApplicant(Guid applicantId, CancellationToken cancellationToken = default)
        {
            _applicants[applicantId] = new Applicant { Id = applicantId, ApplicationNumber = "APP-001", FirstName = "Test", LastName = "Applicant" };
            return Task.CompletedTask;
        }

        public Task AddRequirement(Guid programmeId, string requirementType, string description, bool isMandatory, CancellationToken cancellationToken = default)
        {
            _requirements.Add(new AdmissionRequirement { ProgrammeId = programmeId, RequirementType = requirementType, Description = description, IsMandatory = isMandatory });
            return Task.CompletedTask;
        }

        public Task UpdateAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
        {
            _admissions[admission.Id] = admission;
            return Task.CompletedTask;
        }

        public Task DeleteAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default)
        {
            _admissions.Remove(admissionId);
            return Task.CompletedTask;
        }

        public Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<IReadOnlyList<AdmissionRequirement>> GetAdmissionRequirementsAsync(Guid programmeId, bool mandatoryOnly = false, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AdmissionRequirement>>(_requirements.Where(r => r.ProgrammeId == programmeId && (!mandatoryOnly || r.IsMandatory)).ToList());
    }
}
