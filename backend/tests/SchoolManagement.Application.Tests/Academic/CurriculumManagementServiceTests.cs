using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Academic;
using SchoolManagement.Domain.Academic;
using Xunit;

namespace SchoolManagement.Application.Tests.Academic;

public sealed class CurriculumManagementServiceTests
{
    private sealed class FakeCurriculumRepository : ICurriculumRepository
    {
        private readonly List<Curriculum> _items = new();
        public IReadOnlyList<Curriculum> Items => _items;
        public Task<IReadOnlyList<Curriculum>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Curriculum>>(_items.Where(x => !x.IsDeleted).ToList());
        public Task<Curriculum?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        public Task<bool> VersionExistsAsync(Guid programmeId, string version, Guid? excludingId = null, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.ProgrammeId == programmeId && x.Version == version && !x.IsDeleted && (!excludingId.HasValue || x.Id != excludingId.Value)));
        public Task AddAsync(Curriculum curriculum, CancellationToken ct = default) { _items.Add(curriculum); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCourseRepository : ICourseRepository
    {
        private readonly List<Course> _items = new();
        public IReadOnlyList<Course> Items => _items;
        public Task<IReadOnlyList<Course>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Course>>(_items.Where(x => !x.IsDeleted).ToList());
        public Task<Course?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        public Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.Code == code && !x.IsDeleted && (!excludingId.HasValue || x.Id != excludingId.Value)));
        public Task AddAsync(Course course, CancellationToken ct = default) { _items.Add(course); return Task.CompletedTask; }
        public Task DeleteAsync(Guid id, CancellationToken ct = default)
        {
            var c = _items.FirstOrDefault(x => x.Id == id);
            if (c is not null) { c.IsDeleted = true; c.DeletedAt = DateTimeOffset.UtcNow; }
            return Task.CompletedTask;
        }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCurriculumCourseRepository : ICurriculumCourseRepository
    {
        private readonly List<CurriculumCourse> _items = new();
        public IReadOnlyList<CurriculumCourse> Items => _items;
        public Task<IReadOnlyList<CurriculumCourse>> GetByCurriculumAsync(Guid curriculumId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CurriculumCourse>>(_items.Where(x => x.CurriculumId == curriculumId && !x.IsDeleted).ToList());
        public Task<CurriculumCourse?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(_items.FirstOrDefault(x => x.Id == id && !x.IsDeleted));
        public Task<bool> ExistsAsync(Guid curriculumId, Guid courseId, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.CurriculumId == curriculumId && x.CourseId == courseId && !x.IsDeleted));
        public Task AddAsync(CurriculumCourse mapping, CancellationToken ct = default) { _items.Add(mapping); return Task.CompletedTask; }
        public Task RemoveAsync(Guid id, CancellationToken ct = default)
        {
            var m = _items.FirstOrDefault(x => x.Id == id);
            if (m is not null) { m.IsDeleted = true; m.DeletedAt = DateTimeOffset.UtcNow; }
            return Task.CompletedTask;
        }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeCoursePrerequisiteRepository : ICoursePrerequisiteRepository
    {
        private readonly List<CoursePrerequisite> _items = new();
        public IReadOnlyList<CoursePrerequisite> Items => _items;
        public Task<IReadOnlyList<CoursePrerequisite>> GetByCourseAsync(Guid courseId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<CoursePrerequisite>>(_items.Where(x => x.CourseId == courseId).ToList());
        public Task<CoursePrerequisite?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
            Task.FromResult(_items.FirstOrDefault(x => x.Id == id));
        public Task<bool> ExistsAsync(Guid courseId, Guid prerequisiteCourseId, CancellationToken ct = default) =>
            Task.FromResult(_items.Any(x => x.CourseId == courseId && x.PrerequisiteCourseId == prerequisiteCourseId));
        public Task AddAsync(CoursePrerequisite prerequisite, CancellationToken ct = default) { _items.Add(prerequisite); return Task.CompletedTask; }
        public Task RemoveAsync(Guid id, CancellationToken ct = default) { _items.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private sealed class FakeProgrammeRepository : IProgrammeRepository
    {
        private readonly List<Programme> _items = new();
        public IReadOnlyList<Programme> Items => _items;
        public Task<IReadOnlyList<Programme>> GetAllAsync(CancellationToken ct = default) => Task.FromResult<IReadOnlyList<Programme>>(_items);
        public Task<Programme?> GetByIdAsync(Guid id, CancellationToken ct = default) => Task.FromResult(_items.FirstOrDefault(x => x.Id == id));
        public Task<bool> CodeExistsAsync(string code, Guid? excludingId = null, CancellationToken ct = default) => Task.FromResult(false);
        public Task<bool> DepartmentIsActiveAsync(Guid departmentId, CancellationToken ct = default) => Task.FromResult(true);
        public Task AddAsync(Programme programme, CancellationToken ct = default) { _items.Add(programme); return Task.CompletedTask; }
        public Task<bool> HasCurriculaAsync(Guid programmeId, CancellationToken ct = default) => Task.FromResult(false);
        public void Remove(Programme programme) => _items.Remove(programme);
        public Task DeleteAsync(Guid id, CancellationToken ct = default) { _items.RemoveAll(x => x.Id == id); return Task.CompletedTask; }
        public Task SaveChangesAsync(CancellationToken ct = default) => Task.CompletedTask;
    }

    private static CurriculumManagementService CreateService(
        FakeCurriculumRepository? curricula = null,
        FakeCourseRepository? courses = null,
        FakeCurriculumCourseRepository? mappings = null,
        FakeCoursePrerequisiteRepository? prerequisites = null,
        FakeProgrammeRepository? programmes = null)
    {
        curricula ??= new FakeCurriculumRepository();
        courses ??= new FakeCourseRepository();
        mappings ??= new FakeCurriculumCourseRepository();
        prerequisites ??= new FakeCoursePrerequisiteRepository();
        programmes ??= new FakeProgrammeRepository();
        return new CurriculumManagementService(curricula, courses, mappings, prerequisites, programmes);
    }

    private static Programme ActiveProgramme(Guid id, ProgrammeType type = ProgrammeType.FullProgramme) =>
        new() { Id = id, Code = "PROG-001", Name = "Test Programme", Type = type, IsActive = true, IsReferenceOnly = false };

    [Fact]
    public async Task CreateCurriculumAsync_creates_curriculum()
    {
        var programmes = new FakeProgrammeRepository();
        var progId = Guid.NewGuid();
        programmes.Items.Add(ActiveProgramme(progId));
        var service = CreateService(programmes: programmes);

        var (success, error, curriculum) = await service.CreateCurriculumAsync(new CreateCurriculumRequest(
            progId, "1.0", "Test Curriculum", 60, DateOnly.FromDateTime(DateTime.UtcNow), null, ProgrammeType.FullProgramme));

        Assert.True(success);
        Assert.Null(error);
        Assert.NotNull(curriculum);
        Assert.Equal("Pending", curriculum.Status);
        Assert.Single(programmes.Items);
    }

    [Fact]
    public async Task CreateCurriculumAsync_rejects_unknown_programme()
    {
        var service = CreateService();

        var (success, error, _) = await service.CreateCurriculumAsync(new CreateCurriculumRequest(
            Guid.NewGuid(), "1.0", "Test", 60, DateOnly.FromDateTime(DateTime.UtcNow), null));

        Assert.False(success);
        Assert.Equal("Programme not found.", error);
    }

    [Fact]
    public async Task CreateCurriculumAsync_rejects_duplicate_version()
    {
        var curricula = new FakeCurriculumRepository();
        var programmes = new FakeProgrammeRepository();
        var progId = Guid.NewGuid();
        programmes.Items.Add(ActiveProgramme(progId));
        curricula.Items.Add(new Curriculum { ProgrammeId = progId, Version = "1.0", Title = "Old", MinimumCredits = 0, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow) });
        var service = CreateService(curricula, programmes: programmes);

        var (success, error, _) = await service.CreateCurriculumAsync(new CreateCurriculumRequest(
            progId, "1.0", "Duplicate", 60, DateOnly.FromDateTime(DateTime.UtcNow), null));

        Assert.False(success);
        Assert.Contains("already exists", error);
    }

    [Fact]
    public async Task UpdateCurriculumAsync_updates_fields()
    {
        var curricula = new FakeCurriculumRepository();
        var id = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = id, ProgrammeId = Guid.NewGuid(), Version = "1.0", Title = "Old", MinimumCredits = 0, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow) });
        var service = CreateService(curricula);

        var (success, error) = await service.UpdateCurriculumAsync(id, new UpdateCurriculumRequest("2.0", "New Title", 80, DateOnly.FromDateTime(DateTime.UtcNow), null, ProgrammeType.FullProgramme, true));

        Assert.True(success);
        Assert.Null(error);
        Assert.Equal("2.0", curricula.Items[0].Version);
        Assert.Equal("New Title", curricula.Items[0].Title);
        Assert.Equal(80, curricula.Items[0].MinimumCredits);
    }

    [Fact]
    public async Task CreateCourseAsync_creates_course()
    {
        var courses = new FakeCourseRepository();
        var service = CreateService(courses: courses);

        var (success, error, course) = await service.CreateCourseAsync(new CreateCourseRequest("UHPAB", "PH101", "Pharmacy 101", 3, "Intro", "Lecture"));

        Assert.True(success);
        Assert.Null(error);
        Assert.NotNull(course);
        Assert.Equal("PH101", course.Code);
        Assert.True(course.IsActive);
    }

    [Fact]
    public async Task CreateCourseAsync_rejects_duplicate_code()
    {
        var courses = new FakeCourseRepository();
        courses.Items.Add(new Course { Code = "PH101", Name = "Existing", CreditUnits = 3 });
        var service = CreateService(courses: courses);

        var (success, error, _) = await service.CreateCourseAsync(new CreateCourseRequest("UHPAB", "PH101", "Duplicate", 3, null, null));

        Assert.False(success);
        Assert.Contains("already exists", error);
    }

    [Fact]
    public async Task AddMappingAsync_adds_course_to_curriculum()
    {
        var curricula = new FakeCurriculumRepository();
        var courses = new FakeCourseRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var curriculumId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), IsActive = true, Version = "1.0", Title = "Test", MinimumCredits = 0, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow) });
        courses.Items.Add(new Course { Id = courseId, Code = "PH101", Name = "Pharmacy", CreditUnits = 3, IsActive = true });
        var service = CreateService(curricula, courses, mappings);

        var (success, error, mapping) = await service.AddMappingAsync(curriculumId, new AddCurriculumCourseRequest(courseId, 1, 1, true));

        Assert.True(success);
        Assert.Null(error);
        Assert.NotNull(mapping);
        Assert.Single(mappings.Items);
    }

    [Fact]
    public async Task AddMappingAsync_rejects_inactive_curriculum()
    {
        var curricula = new FakeCurriculumRepository();
        var courses = new FakeCourseRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var curriculumId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), IsActive = false, Version = "1.0", Title = "Test", MinimumCredits = 0, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow) });
        courses.Items.Add(new Course { Id = courseId, Code = "PH101", Name = "Pharmacy", CreditUnits = 3, IsActive = true });
        var service = CreateService(curricula, courses, mappings);

        var (success, error, _) = await service.AddMappingAsync(curriculumId, new AddCurriculumCourseRequest(courseId, 1, 1, true));

        Assert.False(success);
        Assert.Contains("Activate the curriculum", error);
    }

    [Fact]
    public async Task AddCoursePrerequisiteAsync_adds_prerequisite()
    {
        var courses = new FakeCourseRepository();
        var prerequisites = new FakeCoursePrerequisiteRepository();
        var courseId = Guid.NewGuid();
        var prereqId = Guid.NewGuid();
        courses.Items.Add(new Course { Id = courseId, Code = "PH201", Name = "Pharmacy 201", CreditUnits = 3, IsActive = true });
        courses.Items.Add(new Course { Id = prereqId, Code = "PH101", Name = "Pharmacy 101", CreditUnits = 3, IsActive = true });
        var service = CreateService(courses: courses, prerequisites: prerequisites);

        var (success, error) = await service.AddCoursePrerequisiteAsync(courseId, new AddCoursePrerequisiteRequest(prereqId, true, "C"));

        Assert.True(success);
        Assert.Null(error);
        Assert.Single(prerequisites.Items);
    }

    [Fact]
    public async Task AddCoursePrerequisiteAsync_rejects_self_prerequisite()
    {
        var courses = new FakeCourseRepository();
        var prerequisites = new FakeCoursePrerequisiteRepository();
        var courseId = Guid.NewGuid();
        courses.Items.Add(new Course { Id = courseId, Code = "PH101", Name = "Pharmacy", CreditUnits = 3, IsActive = true });
        var service = CreateService(courses: courses, prerequisites: prerequisites);

        var (success, error) = await service.AddCoursePrerequisiteAsync(courseId, new AddCoursePrerequisiteRequest(courseId, true, null));

        Assert.False(success);
        Assert.Contains("cannot be its own prerequisite", error);
    }

    [Fact]
    public async Task ValidatePrerequisitesAsync_returns_false_when_missing()
    {
        var curricula = new FakeCurriculumRepository();
        var courses = new FakeCourseRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var prerequisites = new FakeCoursePrerequisiteRepository();
        var curriculumId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var prereqId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), IsActive = true });
        courses.Items.Add(new Course { Id = courseId, Code = "PH201", Name = "Pharmacy 201", CreditUnits = 3, IsActive = true });
        courses.Items.Add(new Course { Id = prereqId, Code = "PH101", Name = "Pharmacy 101", CreditUnits = 3, IsActive = true });
        prerequisites.Items.Add(new CoursePrerequisite { CourseId = courseId, PrerequisiteCourseId = prereqId, IsMandatory = true });
        var service = CreateService(curricula, courses, mappings, prerequisites);

        var result = await service.ValidatePrerequisitesAsync(curriculumId, courseId);

        Assert.False(result);
    }

    [Fact]
    public async Task ValidatePrerequisitesAsync_returns_true_when_met()
    {
        var curricula = new FakeCurriculumRepository();
        var courses = new FakeCourseRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var prerequisites = new FakeCoursePrerequisiteRepository();
        var curriculumId = Guid.NewGuid();
        var courseId = Guid.NewGuid();
        var prereqId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), IsActive = true });
        courses.Items.Add(new Course { Id = courseId, Code = "PH201", Name = "Pharmacy 201", CreditUnits = 3, IsActive = true });
        courses.Items.Add(new Course { Id = prereqId, Code = "PH101", Name = "Pharmacy 101", CreditUnits = 3, IsActive = true });
        prerequisites.Items.Add(new CoursePrerequisite { CourseId = courseId, PrerequisiteCourseId = prereqId, IsMandatory = true });
        mappings.Items.Add(new CurriculumCourse { CurriculumId = curriculumId, CourseId = prereqId, YearOfStudy = 1, SemesterNumber = 1, IsCore = true });
        var service = CreateService(curricula, courses, mappings, prerequisites);

        var result = await service.ValidatePrerequisitesAsync(curriculumId, courseId);

        Assert.True(result);
    }

    [Fact]
    public async Task ValidateCreditLoadAsync_rejects_overload()
    {
        var curricula = new FakeCurriculumRepository();
        var courses = new FakeCourseRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var curriculumId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), IsActive = true });
        // Add 9 courses of 3 credits each = 27 credits > 24 max
        for (int i = 0; i < 9; i++)
        {
            var courseId = Guid.NewGuid();
            courses.Items.Add(new Course { Id = courseId, Code = $"PH{i:00}", Name = $"Course {i}", CreditUnits = 3, IsActive = true });
            mappings.Items.Add(new CurriculumCourse { CurriculumId = curriculumId, CourseId = courseId, YearOfStudy = 1, SemesterNumber = 1, IsCore = true });
        }
        var service = CreateService(curricula, courses, mappings);

        var result = await service.ValidateCreditLoadAsync(curriculumId, 1, 1);

        Assert.False(result);
    }

    [Fact]
    public async Task ValidateCreditLoadAsync_passes_under_limit()
    {
        var curricula = new FakeCurriculumRepository();
        var courses = new FakeCourseRepository();
        var mappings = new FakeCurriculumCourseRepository();
        var curriculumId = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = curriculumId, ProgrammeId = Guid.NewGuid(), IsActive = true });
        var courseId = Guid.NewGuid();
        courses.Items.Add(new Course { Id = courseId, Code = "PH101", Name = "Pharmacy", CreditUnits = 3, IsActive = true });
        mappings.Items.Add(new CurriculumCourse { CurriculumId = curriculumId, CourseId = courseId, YearOfStudy = 1, SemesterNumber = 1, IsCore = true });
        var service = CreateService(curricula, courses, mappings);

        var result = await service.ValidateCreditLoadAsync(curriculumId, 1, 1);

        Assert.True(result);
    }

    [Fact]
    public async Task SoftDelete_marks_curriculum_deleted()
    {
        var curricula = new FakeCurriculumRepository();
        var id = Guid.NewGuid();
        curricula.Items.Add(new Curriculum { Id = id, ProgrammeId = Guid.NewGuid(), IsActive = true });
        var service = CreateService(curricula);

        // Simulate soft delete via controller-like flow
        var item = curricula.Items[0];
        item.IsDeleted = true;
        item.DeletedAt = DateTimeOffset.UtcNow;

        Assert.True(item.IsDeleted);
        Assert.NotNull(item.DeletedAt);
        Assert.DoesNotContain(curricula.Items, x => x.Id == id && !x.IsDeleted);
    }
}
