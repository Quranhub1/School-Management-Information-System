using SchoolManagement.Application.Admissions;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Admissions;

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

        Assert.Equal(AdmissionStatus.Pending, admission.Status);
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
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        repo.AddApplicant(admission.ApplicantId);
        repo.AddRequirement(admission.ProgrammeId, "Birth certificate", isMandatory: true);

        var service = new AdmissionService(repo);
        var decision = await service.DecideAsync(admission.Id, AdmissionStatus.Accepted, "Met all requirements", "registrar");

        Assert.Equal(AdmissionStatus.Accepted, admission.Status);
        Assert.Equal(ApplicantStatus.Accepted, repo.Applicants[admission.ApplicantId].Status);
        Assert.Equal(AdmissionStatus.Accepted, decision.Decision);
        Assert.Equal("Met all requirements", decision.Reason);
        Assert.Equal("registrar", decision.DecidedBy);
        Assert.NotNull(admission.DecidedAt);
    }

    [Fact]
    public async Task DecideAsync_Rejected_SetsStatusAndApplicant()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        repo.AddApplicant(admission.ApplicantId);

        var service = new AdmissionService(repo);
        var decision = await service.DecideAsync(admission.Id, AdmissionStatus.Rejected, "Incomplete documents", "registrar");

        Assert.Equal(AdmissionStatus.Rejected, admission.Status);
        Assert.Equal(ApplicantStatus.Rejected, repo.Applicants[admission.ApplicantId].Status);
        Assert.Equal(AdmissionStatus.Rejected, decision.Decision);
    }

    [Fact]
    public async Task DecideAsync_RejectsNonPendingAdmission()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        admission.Status = AdmissionStatus.Accepted;
        repo.Admissions[0] = admission;

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, AdmissionStatus.Rejected));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithoutMandatoryRequirements_Throws()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        repo.AddApplicant(admission.ApplicantId);
        // No mandatory requirements added for this programme

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, AdmissionStatus.Accepted));
    }

    [Fact]
    public async Task DecideAsync_AcceptedWithOnlyOptionalRequirements_Throws()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        repo.AddApplicant(admission.ApplicantId);
        repo.AddRequirement(admission.ProgrammeId, "Optional document", isMandatory: false);

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, AdmissionStatus.Accepted));
    }

    [Fact]
    public async Task UpdateAsync_ChangesStatus()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var service = new AdmissionService(repo);
        var updated = await service.UpdateAsync(admission.Id, AdmissionStatus.Rejected);

        Assert.NotNull(updated);
        Assert.Equal(AdmissionStatus.Rejected, updated.Status);
    }

    [Fact]
    public async Task UpdateAsync_UnknownAdmission_ReturnsNull()
    {
        var repo = new FakeAdmissionRepository();
        var service = new AdmissionService(repo);

        var updated = await service.UpdateAsync(Guid.NewGuid(), AdmissionStatus.Rejected);

        Assert.Null(updated);
    }

    [Fact]
    public async Task DeleteAsync_RemovesAdmission()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

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
}

public sealed class FakeAdmissionRepository : IAdmissionRepository
{
    private readonly bool _applicantExists;
    public List<Admission> Admissions { get; } = [];
    public Dictionary<Guid, Applicant> Applicants { get; } = [];
    public List<AdmissionRequirement> Requirements { get; } = [];
    public List<AdmissionDecision> Decisions { get; } = [];

    public FakeAdmissionRepository(bool applicantExists = true) => _applicantExists = applicantExists;

    public Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default)
    {
        if (!_applicantExists) return Task.FromResult<Applicant?>(null);
        if (Applicants.TryGetValue(applicantId, out var existing))
            return Task.FromResult<Applicant?>(existing);
        return Task.FromResult<Applicant?>(new Applicant
        {
            Id = applicantId,
            ApplicationNumber = "APP-001",
            FirstName = "Test",
            LastName = "Applicant"
        });
    }

    public void AddApplicant(Guid applicantId) =>
        Applicants[applicantId] = new Applicant
        {
            Id = applicantId,
            ApplicationNumber = "APP-001",
            FirstName = "Test",
            LastName = "Applicant"
        };

    public Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Admissions.FirstOrDefault(x => x.Id == admissionId));

    public Task<IReadOnlyList<Admission>> GetAllAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<Admission>>(Admissions);

    public async Task<Admission> AddAdmissionAsync(Guid applicantId, Guid programmeId, Guid academicYearId, Guid intakeId)
    {
        var admission = new Admission
        {
            ApplicantId = applicantId,
            ProgrammeId = programmeId,
            AcademicYearId = academicYearId,
            IntakeId = intakeId,
            Status = AdmissionStatus.Pending
        };
        Admissions.Add(admission);
        return admission;
    }

    public Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
    {
        Admissions.Add(admission);
        return Task.CompletedTask;
    }

    public Task UpdateAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
    {
        var index = Admissions.FindIndex(x => x.Id == admission.Id);
        if (index >= 0) Admissions[index] = admission;
        return Task.CompletedTask;
    }

    public Task DeleteAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default)
    {
        Admissions.RemoveAll(x => x.Id == admissionId);
        return Task.CompletedTask;
    }

    public void AddRequirement(Guid programmeId, string description, bool isMandatory)
    {
        Requirements.Add(new AdmissionRequirement
        {
            Id = Guid.NewGuid(),
            ProgrammeId = programmeId,
            RequirementType = "Document",
            Description = description,
            IsMandatory = isMandatory,
            IsActive = true
        });
    }

    public Task<IReadOnlyList<AdmissionRequirement>> GetAdmissionRequirementsAsync(
        Guid programmeId, bool mandatoryOnly = false, CancellationToken cancellationToken = default)
    {
        var query = Requirements.Where(x => x.ProgrammeId == programmeId && x.IsActive);
        if (mandatoryOnly) query = query.Where(x => x.IsMandatory);
        return Task.FromResult<IReadOnlyList<AdmissionRequirement>>(query.ToList());
    }

    public Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default)
    {
        Decisions.Add(decision);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
}
