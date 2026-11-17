using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Domain.Admissions;
using Xunit;

namespace SchoolManagement.Application.Tests.Admissions;

public sealed class AdmissionServiceTests
{
    [Fact]
    public async Task CreateAsync_CreatesPendingAdmissionForKnownApplicant()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var service = new AdmissionService(repo);

        var admission = await service.CreateAsync(applicant.Id, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        Assert.Equal("Pending", admission.Status);
        Assert.Single(repo.Admissions);
        Assert.Equal(1, repo.SaveChangesCount);
    }

    [Fact]
    public async Task CreateAsync_RejectsUnknownApplicant()
    {
        var service = new AdmissionService(new FakeAdmissionRepository());
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            service.CreateAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithMandatoryRequirement_UpdatesAdmissionApplicantAndDecision()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var admission = repo.AddAdmission(applicant.Id);
        repo.AddRequirement(admission.ProgrammeId, mandatory: true);
        var service = new AdmissionService(repo);

        var decision = await service.DecideAsync(admission.Id, "Accepted", "Requirements met", "registrar");

        Assert.Equal("Accepted", admission.Status);
        Assert.Equal("Accepted", applicant.Status);
        Assert.Equal("Accepted", decision.Decision);
        Assert.Equal("Requirements met", decision.Reason);
        Assert.Equal("registrar", decision.DecidedBy);
        Assert.Single(repo.Decisions);
        Assert.Equal(1, repo.SaveChangesCount);
        Assert.NotNull(admission.DecidedAt);
    }

    [Fact]
    public async Task DecideAsync_Rejected_UpdatesAdmissionApplicantAndDecision()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var admission = repo.AddAdmission(applicant.Id);
        var service = new AdmissionService(repo);

        var decision = await service.DecideAsync(admission.Id, "Rejected", "Incomplete documents", "registrar");

        Assert.Equal("Rejected", admission.Status);
        Assert.Equal("Rejected", applicant.Status);
        Assert.Equal("Rejected", decision.Decision);
        Assert.Equal("Incomplete documents", decision.Reason);
        Assert.Single(repo.Decisions);
    }

    [Fact]
    public async Task DecideAsync_RejectsAnAdmissionThatIsNotPending()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var admission = repo.AddAdmission(applicant.Id);
        admission.Status = "Accepted";
        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, "Rejected"));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithoutMandatoryRequirements_Throws()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var admission = repo.AddAdmission(applicant.Id);
        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, "Accepted"));
    }

    [Fact]
    public async Task UpdateAsync_ChangesStatus()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var admission = repo.AddAdmission(applicant.Id);
        var service = new AdmissionService(repo);

        var updated = await service.UpdateAsync(admission.Id, "Rejected");

        Assert.NotNull(updated);
        Assert.Equal("Rejected", updated.Status);
    }

    [Fact]
    public async Task UpdateAsync_UnknownAdmission_ReturnsNull()
    {
        var service = new AdmissionService(new FakeAdmissionRepository());
        Assert.Null(await service.UpdateAsync(Guid.NewGuid(), "Rejected"));
    }

    [Fact]
    public async Task DeleteAsync_RemovesAdmission()
    {
        var repo = new FakeAdmissionRepository();
        var applicant = repo.AddApplicant();
        var admission = repo.AddAdmission(applicant.Id);
        var service = new AdmissionService(repo);

        Assert.True(await service.DeleteAsync(admission.Id));
        Assert.Empty(repo.Admissions);
    }

    [Fact]
    public async Task DeleteAsync_UnknownAdmission_ReturnsFalse()
    {
        var service = new AdmissionService(new FakeAdmissionRepository());
        Assert.False(await service.DeleteAsync(Guid.NewGuid()));
    }

    private sealed class FakeAdmissionRepository : IAdmissionRepository
    {
        private readonly Dictionary<Guid, Admission> _admissions = new();
        private readonly Dictionary<Guid, Applicant> _applicants = new();
        private readonly List<AdmissionRequirement> _requirements = new();
        private readonly List<AdmissionDecision> _decisions = new();

        public IReadOnlyList<Admission> Admissions => _admissions.Values.ToList();
        public IReadOnlyList<AdmissionDecision> Decisions => _decisions;
        public int SaveChangesCount { get; private set; }

        public Applicant AddApplicant()
        {
            var applicant = new Applicant
            {
                ApplicationNumber = "APP-001",
                FirstName = "Test",
                LastName = "Applicant"
            };
            _applicants[applicant.Id] = applicant;
            return applicant;
        }

        public Admission AddAdmission(Guid applicantId)
        {
            var admission = new Admission
            {
                ApplicantId = applicantId,
                ProgrammeId = Guid.NewGuid(),
                AcademicYearId = Guid.NewGuid(),
                IntakeId = Guid.NewGuid()
            };
            _admissions[admission.Id] = admission;
            return admission;
        }

        public void AddRequirement(Guid programmeId, bool mandatory)
        {
            _requirements.Add(new AdmissionRequirement
            {
                ProgrammeId = programmeId,
                RequirementType = "Document",
                Description = "Required admission document",
                IsMandatory = mandatory
            });
        }

        public Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_applicants.TryGetValue(applicantId, out var applicant) ? applicant : null);

        public Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_admissions.TryGetValue(admissionId, out var admission) ? admission : null);

        public Task<IReadOnlyList<Admission>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Admission>>(_admissions.Values.ToList());

        public Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
        {
            _admissions[admission.Id] = admission;
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

        public Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default)
        {
            _decisions.Add(decision);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveChangesCount++;
            return Task.CompletedTask;
        }

        public Task<IReadOnlyList<AdmissionRequirement>> GetAdmissionRequirementsAsync(
            Guid programmeId,
            bool mandatoryOnly = false,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<AdmissionRequirement>>(
                _requirements.Where(x => x.ProgrammeId == programmeId && (!mandatoryOnly || x.IsMandatory)).ToList());
    }
}
