using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Domain.Admissions;
using Xunit;

namespace SchoolManagement.Application.Tests.Admissions;

public sealed class AdmissionsWorkflowServiceTests
{
    [Fact]
    public async Task CreateAsync_creates_pending_admission()
    {
        var applicantId = Guid.NewGuid();
        var repository = new FakeAdmissionRepository(applicantId);
        var workflow = new AdmissionsWorkflowService(new AdmissionService(repository));

        var result = await workflow.CreateAsync(new CreateAdmissionRequest(
            applicantId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        Assert.Equal(applicantId, result.ApplicantId);
        Assert.Equal("Pending", result.Status);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task DecideAsync_updates_status_and_records_decision()
    {
        var admission = new Admission
        {
            ApplicantId = Guid.NewGuid(),
            ProgrammeId = Guid.NewGuid(),
            AcademicYearId = Guid.NewGuid(),
            IntakeId = Guid.NewGuid(),
            Status = "Pending"
        };
        var repository = new FakeAdmissionRepository(admission);
        var workflow = new AdmissionsWorkflowService(new AdmissionService(repository));

        var result = await workflow.DecideAsync(admission.Id,
            new DecideAdmissionRequest("Accepted", "Meets requirements", "tester"));

        Assert.Equal("Accepted", result.Decision);
        Assert.Equal("Accepted", admission.Status);
        Assert.NotNull(repository.LastDecision);
    }

    private sealed class FakeAdmissionRepository : IAdmissionRepository
    {
        private readonly Dictionary<Guid, Admission> _admissions = new();
        private readonly HashSet<Guid> _applicants = new();
        public AdmissionDecision? LastDecision { get; private set; }

        public FakeAdmissionRepository(Guid applicantId) => _applicants.Add(applicantId);

        public FakeAdmissionRepository(Admission admission)
        {
            _admissions[admission.Id] = admission;
            _applicants.Add(admission.ApplicantId);
        }

        public Task<Applicant?> GetApplicantAsync(Guid applicantId, CancellationToken cancellationToken = default) =>
            Task.FromResult<Applicant?>(_applicants.Contains(applicantId) ? new Applicant { Id = applicantId, ApplicationNumber = "APP-001", FirstName = "Test", LastName = "Applicant" } : null);

        public Task<Admission?> GetAdmissionAsync(Guid admissionId, CancellationToken cancellationToken = default) =>
            Task.FromResult(_admissions.TryGetValue(admissionId, out var admission) ? admission : null);

        public Task AddAdmissionAsync(Admission admission, CancellationToken cancellationToken = default)
        {
            _admissions[admission.Id] = admission;
            return Task.CompletedTask;
        }

        public Task AddDecisionAsync(AdmissionDecision decision, CancellationToken cancellationToken = default)
        {
            LastDecision = decision;
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
