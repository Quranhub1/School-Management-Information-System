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
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        repo.AddApplicant(admission.ApplicantId);
        repo.AddRequirement(admission.ProgrammeId, "Birth certificate", isMandatory: true);

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
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
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
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());
        admission.Status = "Accepted";
        repo.Admissions[0] = admission;

        var service = new AdmissionService(repo);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.DecideAsync(admission.Id, "Rejected"));
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
            service.DecideAsync(admission.Id, "Accepted"));
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
            service.DecideAsync(admission.Id, "Accepted"));
    }

    [Fact]
    public async Task UpdateAsync_ChangesStatus()
    {
        var repo = new FakeAdmissionRepository();
        var admission = await repo.AddAdmissionAsync(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

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
