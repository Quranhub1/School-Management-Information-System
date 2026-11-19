using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Academic;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Students;
using Xunit;

namespace SchoolManagement.Application.Tests.Academic;

public sealed class CurriculumIntegrationsTests
{
    private sealed class FakeCourseRepository : ICourseRepository
    {
        private readonly List<Course> _items = new();
        public List<Course> Items => _items;
        public Task<IReadOnlyList<Course>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Course>>(_items.Where(x => !x.IsDeleted).ToList());
        public Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        public Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken ct = default) => Task.FromResult(false);
        public Task AddAsync(Course course, CancellationToken ct = default) { _items.Add(course); return Task.CompletedTask; }
        public Task DeleteAsync(Guid id, CancellationToken ct = default) { var c = _items.FirstOrDefault(x => x.Id == id); if (c is not null) c.IsDeleted = true; return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCurriculumCourseRepository : ICurriculumCourseRepository
    {
        private readonly List<CurriculumCourse> _items = new();
        public List<CurriculumCourse> Items => _items;
        public Task<IReadOnlyList<CurriculumCourse>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CurriculumCourse>>(_items.Where(x => x.CurriculumId == curriculumId && !x.IsDeleted).ToList());
        public Task<CurriculumCourse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(_items.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        public Task<bool> ExistsAsync(Guid curriculumId, Guid courseId, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.CurriculumId == curriculumId && x.CourseId == courseId && !x.IsDeleted));
        public Task AddAsync(CurriculumCourse mapping, CancellationToken ct = default) { _items.Add(mapping); return Task.CompletedTask; }
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { var m = _items.FirstOrDefault(x => x.Id == id); if (m is not null) m.IsDeleted = true; return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCoursePrerequisiteRepository : ICoursePrerequisiteRepository
    {
        private readonly List<CoursePrerequisite> _items = new();
        public List<CoursePrerequisite> Items => _items;
        public Task<IReadOnlyList<CoursePrerequisite>> GetByCourseAsync(Guid courseId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CoursePrerequisite>>(_items.Where(x => x.CourseId == courseId).ToList());
        public Task<CoursePrerequisite?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id));
        public Task<bool> ExistsAsync(Guid courseId, Guid prerequisiteCourseId, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.CourseId == courseId && x.PrerequisiteCourseId == prerequisiteCourseId));
        public Task AddAsync(CoursePrerequisite prerequisite, CancellationToken ct = default) { _items.Add(prerequisite); return Task.CompletedTask; }
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { _items.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCurriculumRepository : ICurriculumRepository
    {
        private readonly List<Curriculum> _items = new();
        public List<Curriculum> Items => _items;
        public Task<IReadOnlyList<Curriculum>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Curriculum>>(_items.Where(x => !x.IsDeleted).ToList());
        public Task<Curriculum?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        public Task<bool> VersionExistsAsync(Guid programmeId, string version, Guid? excludingId = null, CancellationToken ct = default) => Task.FromResult(false);
        public Task AddAsync(Curriculum curriculum, CancellationToken ct = default) { _items.Add(curriculum); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeElectiveGroupRepository : IElectiveGroupRepository
    {
        private readonly List<ElectiveGroup> _items = new();
        public List<ElectiveGroup> Items => _items;
        public Task<IReadOnlyList<ElectiveGroup>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<ElectiveGroup>>(_items.Where(x => x.CurriculumId == curriculumId && x.IsActive).ToList());
        public Task<ElectiveGroup?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && x.IsActive));
        public Task AddAsync(ElectiveGroup group, CancellationToken ct = default) { _items.Add(group); return Task.CompletedTask; }
        public Task UpdateAsync(ElectiveGroup group, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { var g = _items.FirstOrDefault(x => x.Id == id); if (g is not null) g.IsActive = false; return Task.CompletedTask; }
        public Task<bool> ExistsAsync(Guid curriculumId, int yearOfStudy, int semesterNumber, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.CurriculumId == curriculumId && x.YearOfStudy == yearOfStudy && x.SemesterNumber == semesterNumber && x.IsActive));
        public Task<IReadOnlyList<ElectiveGroupCourse>> GetCoursesByGroupAsync(Guid electiveGroupId, CancellationToken ct = default) => Task.FromResult<IReadOnlyList<ElectiveGroupCourse>>([]);
        public Task AddCourseAsync(ElectiveGroupCourse groupCourse, CancellationToken ct = default) { return Task.CompletedTask; }
        public Task RemoveCourseAsync(Guid groupCourseId, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCurriculumVersionRepository : ICurriculumVersionRepository
    {
        private readonly List<CurriculumVersion> _items = new();
        public Task<IReadOnlyList<CurriculumVersion>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CurriculumVersion>>(_items.Where(x => x.CurriculumId == curriculumId).ToList());
        public Task<CurriculumVersion?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id));
        public Task AddAsync(CurriculumVersion version, CancellationToken ct = default) { _items.Add(version); return Task.CompletedTask; }
        public Task UpdateAsync(CurriculumVersion version, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { _items.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
        public Task<IReadOnlyList<CurriculumVersionCourse>> GetCoursesByVersionAsync(Guid versionId, CancellationToken ct = default) => Task.FromResult<IReadOnlyList<CurriculumVersionCourse>>([]);
        public Task AddCourseAsync(CurriculumVersionCourse versionCourse, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveCourseAsync(Guid versionCourseId, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCourseEquivalenceRepository : ICourseEquivalenceRepository
    {
        private readonly List<CourseEquivalence> _items = new();
        public List<CourseEquivalence> Items => _items;
        public Task<IReadOnlyList<CourseEquivalence>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<CourseEquivalence>>(_items.Where(x => x.IsActive).ToList());
        public Task<CourseEquivalence?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && x.IsActive));
        public Task<bool> ExistsAsync(string externalCourseCode, string externalInstitution, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.ExternalCourseCode == externalCourseCode && x.ExternalInstitution == externalInstitution && x.IsActive));
        public Task AddAsync(CourseEquivalence equivalence, CancellationToken ct = default) { _items.Add(equivalence); return Task.CompletedTask; }
        public Task UpdateAsync(CourseEquivalence equivalence, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { var e = _items.FirstOrDefault(x => x.Id == id); if (e is not null) e.IsActive = false; return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeStudentTransferCreditRepository : IStudentTransferCreditRepository
    {
        private readonly List<StudentTransferCredit> _items = new();
        public Task<IReadOnlyList<StudentTransferCredit>> GetByStudentAsync(Guid studentId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<StudentTransferCredit>>(_items.Where(x => x.StudentId == studentId && x.IsActive).ToList());
        public Task<StudentTransferCredit?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && x.IsActive));
        public Task<bool> ExistsAsync(Guid studentId, Guid courseEquivalenceId, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.StudentId == studentId && x.CourseEquivalenceId == courseEquivalenceId && x.IsActive));
        public Task AddAsync(StudentTransferCredit transferCredit, CancellationToken ct = default) { _items.Add(transferCredit); return Task.CompletedTask; }
        public Task UpdateAsync(StudentTransferCredit transferCredit, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeProgrammeLearningOutcomeRepository : IProgrammeLearningOutcomeRepository
    {
        private readonly List<ProgrammeLearningOutcome> _items = new();
        public Task<IReadOnlyList<ProgrammeLearningOutcome>> GetByProgrammeAsync(Guid programmeId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<ProgrammeLearningOutcome>>(_items.Where(x => x.ProgrammeId == programmeId && x.IsActive).ToList());
        public Task<ProgrammeLearningOutcome?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && x.IsActive));
        public Task AddAsync(ProgrammeLearningOutcome plo, CancellationToken ct = default) { _items.Add(plo); return Task.CompletedTask; }
        public Task UpdateAsync(ProgrammeLearningOutcome plo, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { var p = _items.FirstOrDefault(x => x.Id == id); if (p is not null) p.IsActive = false; return Task.CompletedTask; }
        public Task<IReadOnlyList<CoursePloMapping>> GetMappingsByPloAsync(Guid ploId, CancellationToken ct = default) => Task.FromResult<IReadOnlyList<CoursePloMapping>>([]);
        public Task AddMappingAsync(CoursePloMapping mapping, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveMappingAsync(Guid mappingId, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeLmsCourseRepository : ILmsCourseRepository
    {
        private readonly List<LmsCourse> _items = new();
        public Task<IReadOnlyList<LmsCourse>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<LmsCourse>>(_items.Where(x => x.IsActive).ToList());
        public Task<LmsCourse?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && x.IsActive));
        public Task<LmsCourse?> GetByCourseAsync(Guid courseId, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.CourseId == courseId && x.IsActive));
        public Task AddAsync(LmsCourse lmsCourse, CancellationToken ct = default) { _items.Add(lmsCourse); return Task.CompletedTask; }
        public Task UpdateAsync(LmsCourse lmsCourse, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { var l = _items.FirstOrDefault(x => x.Id == id); if (l is not null) l.IsActive = false; return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeRegulatorImportRepository : IRegulatorImportRepository
    {
        private readonly List<RegulatorImport> _items = new();
        public Task<IReadOnlyList<RegulatorImport>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<RegulatorImport>>(_items);
        public Task<RegulatorImport?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id));
        public Task AddAsync(RegulatorImport import, CancellationToken ct = default) { _items.Add(import); return Task.CompletedTask; }
        public Task UpdateAsync(RegulatorImport import, CancellationToken ct = default) => Task.CompletedTask;
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    [Fact]
    public async Task PrerequisiteChain_ValidatesCorrectly()
    {
        var courses = new FakeCourseRepository();
        var prereqs = new FakeCoursePrerequisiteRepository();
        var c101 = new Course { Id = Guid.NewGuid(), Code = "C101", Name = "Course 101", CreditUnits = 3, IsActive = true };
        var c201 = new Course { Id = Guid.NewGuid(), Code = "C201", Name = "Course 201", CreditUnits = 3, IsActive = true };
        var c301 = new Course { Id = Guid.NewGuid(), Code = "C301", Name = "Course 301", CreditUnits = 3, IsActive = true };
        courses.Items.Add(c101); courses.Items.Add(c201); courses.Items.Add(c301);
        prereqs.Items.Add(new CoursePrerequisite { CourseId = c201.Id, PrerequisiteCourseId = c101.Id, IsMandatory = true });
        prereqs.Items.Add(new CoursePrerequisite { CourseId = c301.Id, PrerequisiteCourseId = c201.Id, IsMandatory = true });

        var service = new PrerequisiteChainService(prereqs, courses);
        Assert.True(await service.ValidateChainAsync(c301.Id));
        var transitive = await service.GetTransitivePrerequisitesAsync(c301.Id);
        Assert.Equal(2, transitive.Count());
    }

    [Fact]
    public async Task PrerequisiteChain_DetectsCycle()
    {
        var courses = new FakeCourseRepository();
        var prereqs = new FakeCoursePrerequisiteRepository();
        var a = new Course { Id = Guid.NewGuid(), Code = "A", Name = "A", CreditUnits = 3, IsActive = true };
        var b = new Course { Id = Guid.NewGuid(), Code = "B", Name = "B", CreditUnits = 3, IsActive = true };
        courses.Items.Add(a); courses.Items.Add(b);
        prereqs.Items.Add(new CoursePrerequisite { CourseId = a.Id, PrerequisiteCourseId = b.Id, IsMandatory = true });
        prereqs.Items.Add(new CoursePrerequisite { CourseId = b.Id, PrerequisiteCourseId = a.Id, IsMandatory = true });

        var service = new PrerequisiteChainService(prereqs, courses);
        Assert.False(await service.ValidateChainAsync(a.Id));
    }

    [Fact]
    public async Task CourseEquivalence_AddsAndLists()
    {
        var courses = new FakeCourseRepository();
        var equivs = new FakeCourseEquivalenceRepository();
        var course = new Course { Id = Guid.NewGuid(), Code = "INT101", Name = "Internal 101", CreditUnits = 3, IsActive = true };
        courses.Items.Add(course);
        var service = new CourseEquivalenceService(equivs, courses);

        var (success, error) = await service.AddAsync("EXT-101", "External 101", "External Uni", course.Id, 3, true);
        Assert.True(success);
        Assert.Null(error);

        var all = await service.GetAllAsync();
        Assert.Single(all);
        Assert.Equal("EXT-101", all[0].ExternalCourseCode);
    }

    [Fact]
    public async Task CourseEquivalence_RejectsDuplicate()
    {
        var courses = new FakeCourseRepository();
        var equivs = new FakeCourseEquivalenceRepository();
        var course = new Course { Id = Guid.NewGuid(), Code = "INT101", Name = "Internal 101", CreditUnits = 3, IsActive = true };
        courses.Items.Add(course);
        equivs.Items.Add(new CourseEquivalence { ExternalCourseCode = "EXT-101", ExternalCourseName = "Ext", ExternalInstitution = "Uni", InternalCourseId = course.Id, CreditsAccepted = 3 });
        var service = new CourseEquivalenceService(equivs, courses);

        var (success, error) = await service.AddAsync("EXT-101", "Ext 2", "Uni", course.Id, 3, true);
        Assert.False(success);
        Assert.Contains("already exists", error);
    }

    [Fact]
    public async Task PloService_AddsAndLists()
    {
        var plos = new FakeProgrammeLearningOutcomeRepository();
        var courses = new FakeCourseRepository();
        var service = new ProgrammeLearningOutcomeService(plos, courses);

        var programmeId = Guid.NewGuid();
        var (success, error) = await service.AddAsync(programmeId, "PLO-01", "Demonstrate knowledge", 1);
        Assert.True(success);

        var all = await service.GetByProgrammeAsync(programmeId);
        Assert.Single(all);
        Assert.Equal("PLO-01", all[0].Code);
    }

    [Fact]
    public async Task LmsCourse_CreatesShell()
    {
        var lms = new FakeLmsCourseRepository();
        var courses = new FakeCourseRepository();
        var course = new Course { Id = Guid.NewGuid(), Code = "LMS101", Name = "LMS Course", CreditUnits = 3, IsActive = true };
        courses.Items.Add(course);
        var service = new LmsCourseService(lms, courses);

        var (success, error) = await service.CreateShellAsync(course.Id, "Moodle", "moodle-123", "https://moodle.example.com/course/123");
        Assert.True(success);
        Assert.Null(error);

        var all = await service.GetAllAsync();
        Assert.Single(all);
        Assert.Equal("Moodle", all[0].LmsPlatform);
    }

    [Fact]
    public async Task RegulatorImport_Records()
    {
        var imports = new FakeRegulatorImportRepository();
        var service = new RegulatorImportService(imports);

        var (success, error) = await service.RecordAsync("UHPAB", "Courses", 100, 95, 5, "file.csv", "Imported UHPAB courses");
        Assert.True(success);

        var all = await service.GetAllAsync();
        Assert.Single(all);
        Assert.Equal("UHPAB", all[0].RegulatorCode);
    }

    [Fact]
    public async Task FeeIntegration_CalculatesCorrectly()
    {
        var curriculumCourses = new FakeCurriculumCourseRepository();
        var courses = new FakeCourseRepository();
        var curriculumId = Guid.NewGuid();
        var c1 = new Course { Id = Guid.NewGuid(), Code = "FEE1", Name = "Fee Course 1", CreditUnits = 3, IsActive = true };
        var c2 = new Course { Id = Guid.NewGuid(), Code = "FEE2", Name = "Fee Course 2", CreditUnits = 4, IsActive = true };
        courses.Items.Add(c1); courses.Items.Add(c2);
        curriculumCourses.Items.Add(new CurriculumCourse { CurriculumId = curriculumId, CourseId = c1.Id, YearOfStudy = 1, SemesterNumber = 1, IsCore = true });
        curriculumCourses.Items.Add(new CurriculumCourse { CurriculumId = curriculumId, CourseId = c2.Id, YearOfStudy = 1, SemesterNumber = 1, IsCore = true });

        var service = new FeeIntegrationService(curriculumCourses, courses);
        var result = await service.CalculateFeesAsync(Guid.NewGuid(), curriculumId, Guid.NewGuid(), 50000m);

        Assert.Equal(7, result.TotalCredits);
        Assert.Equal(350000m, result.TotalFee);
        Assert.Equal(50000m, result.FeePerCredit);
    }

    [Fact]
    public async Task ElectiveGroupService_CreatesAndLists()
    {
        var groups = new FakeElectiveGroupRepository();
        var courses = new FakeCourseRepository();
        var curricula = new FakeCurriculumRepository();
        var curriculumId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), Version = "1.0", Title = "Test", MinimumCredits = 0, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), IsActive = true });
        var service = new ElectiveGroupService(groups, courses, curricula);

        var (success, error, groupId) = await service.CreateAsync(new CreateElectiveGroupRequest(curriculumId, 1, 1, "Electives", 6, 2));
        Assert.True(success);
        Assert.Null(error);
        Assert.NotNull(groupId);

        var all = await service.GetByCurriculumAsync(curriculumId);
        Assert.Single(all);
        Assert.Equal("Electives", all[0].Title);
    }

    [Fact]
    public async Task CurriculumVersionService_CreatesSnapshotAndClones()
    {
        var versions = new FakeCurriculumVersionRepository();
        var curricula = new FakeCurriculumRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var courses = new FakeCourseRepository();
        var curriculumId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), Version = "1.0", Title = "Test", MinimumCredits = 60, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), IsActive = true });
        mappings.Items.Add(new CurriculumCourse { CurriculumId = curriculumId, CourseId = courseId, YearOfStudy = 1, SemesterNumber = 1, IsCore = true });
        courses.Items.Add(new Course { Id = courseId, Code = "VER101", Name = "Version Course", CreditUnits = 3, IsActive = true });
        var service = new CurriculumVersionService(versions, curricula, mappings, courses);

        var (success, error, versionId) = await service.CreateSnapshotAsync(curriculumId, "1.0", "Initial", "First version");
        Assert.True(success);
        Assert.NotNull(versionId);

        var allVersions = await service.GetByCurriculumAsync(curriculumId);
        Assert.Single(allVersions);

        var cloneSuccess = await service.CloneCurriculumAsync(curriculumId, Guid.NewGuid());
        Assert.False(cloneSuccess.Success); // target doesn't exist

        var (diffSuccess, _, diffs) = await service.DiffAsync(versionId.Value, versionId.Value);
        Assert.True(diffSuccess);
        Assert.Empty(diffs);
    }
}
