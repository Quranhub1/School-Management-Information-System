using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Admissions;
using SchoolManagement.Domain.Admissions;
using SchoolManagement.Domain.Students;
using Xunit;

namespace SchoolManagement.Application.Tests.Admissions;

public sealed class AdmissionsWorkflowServiceTests
{
    [Fact]
    public async Task CreateAsync_creates_pending_admission()
    {
        var applicantId = Guid.NewGuid();
        var repository = new FakeAdmissionRepository(applicantId);
        var workflow = CreateWorkflow(repository);

        var result = await workflow.CreateAsync(new CreateAdmissionRequest(
            applicantId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid()));

        Assert.Equal(applicantId, result.ApplicantId);
        Assert.Equal("Pending", result.Status);
        Assert.NotEqual(Guid.Empty, result.Id);
    }

    [Fact]
    public async Task GetAllAsync_returns_all_admissions()
    {
        var applicantId = Guid.NewGuid();
        var admission = new Admission { ApplicantId = applicantId, ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Status = "Pending" };
        var repository = new FakeAdmissionRepository(admission);
        var workflow = CreateWorkflow(repository);

        var results = await workflow.GetAllAsync();

        Assert.Single(results);
        Assert.Equal(admission.Id, results[0].Id);
    }

    [Fact]
    public async Task GetByIdAsync_returns_admission_when_exists()
    {
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Status = "Pending" };
        var repository = new FakeAdmissionRepository(admission);
        var workflow = CreateWorkflow(repository);

        var result = await workflow.GetByIdAsync(admission.Id);

        Assert.NotNull(result);
        Assert.Equal(admission.Id, result!.Id);
    }

    [Fact]
    public async Task UpdateAsync_updates_status()
    {
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Status = "Pending" };
        var repository = new FakeAdmissionRepository(admission);
        var workflow = CreateWorkflow(repository);

        var result = await workflow.UpdateAsync(admission.Id, new UpdateAdmissionRequest(admission.Id, "Accepted"));

        Assert.NotNull(result);
        Assert.Equal("Accepted", result!.Status);
    }

    [Fact]
    public async Task DeleteAsync_removes_admission()
    {
        var admission = new Admission { ApplicantId = Guid.NewGuid(), ProgrammeId = Guid.NewGuid(), AcademicYearId = Guid.NewGuid(), IntakeId = Guid.NewGuid(), Status = "Pending" };
        var repository = new FakeAdmissionRepository(admission);
        var workflow = CreateWorkflow(repository);

        var result = await workflow.DeleteAsync(admission.Id);

        Assert.True(result);
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
        var studentRepository = new FakeStudentRepository();
        var workflow = CreateWorkflow(repository, studentRepository);

        var result = await workflow.DecideAsync(admission.Id,
            new DecideAdmissionRequest("Accepted", "Meets requirements", "tester"));

        Assert.Equal("Accepted", result.Decision);
        Assert.Equal("Accepted", admission.Status);
        Assert.NotNull(repository.LastDecision);
        Assert.Single(studentRepository.Students);
    }

    private static AdmissionsWorkflowService CreateWorkflow(
        IAdmissionRepository repository,
        IStudentRepository? studentRepository = null) =>
        new(new AdmissionService(repository, studentRepository ?? new FakeStudentRepository()));

    private sealed class FakeStudentRepository : IStudentRepository
    {
        public List<Student> Students { get; } = new();

        public Task<IReadOnlyList<Student>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Student>>(Students);

        public Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Students.SingleOrDefault(x => x.Id == id));

        public Task AddAsync(Student student, CancellationToken cancellationToken = default)
        {
            Students.Add(student);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Student student, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            Students.RemoveAll(x => x.Id == id);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
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
            LastDecision = decision;
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
