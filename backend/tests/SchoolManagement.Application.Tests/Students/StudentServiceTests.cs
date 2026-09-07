using SchoolManagement.Application.Abstractions;
using SchoolManagement.Application.Students;
using SchoolManagement.Domain.Students;
using Xunit;

namespace SchoolManagement.Application.Tests.Students;

public sealed class StudentServiceTests
{
    [Fact]
    public async Task CreateAsync_adds_student()
    {
        var repo = new FakeStudentRepository();
        var service = new StudentService(repo);

        var student = await service.CreateAsync(new CreateStudentRequest(
            "STU-001", "John", "Doe", "Other", new DateOnly(2000, 1, 1), "Male", "NAT-001", "0700000000", "john@test.com"), default);

        Assert.Equal("STU-001", student.StudentNumber);
        Assert.Equal("John", student.FirstName);
        Assert.Equal("Doe", student.LastName);
        Assert.Single(repo.Students);
    }

    [Fact]
    public async Task GetByIdAsync_returns_student_when_exists()
    {
        var student = new Student { Id = Guid.NewGuid(), StudentNumber = "STU-002", FirstName = "Jane", LastName = "Doe" };
        var repo = new FakeStudentRepository(student);
        var service = new StudentService(repo);

        var result = await service.GetByIdAsync(student.Id);

        Assert.NotNull(result);
        Assert.Equal(student.Id, result!.Id);
    }

    [Fact]
    public async Task UpdateAsync_updates_student_fields()
    {
        var student = new Student { Id = Guid.NewGuid(), StudentNumber = "STU-003", FirstName = "Old", LastName = "Name" };
        var repo = new FakeStudentRepository(student);
        var service = new StudentService(repo);

        var updated = await service.UpdateAsync(new UpdateStudentRequest(
            student.Id, "STU-003-UPD", "New", "Name", "Other", new DateOnly(2001, 1, 1), "Female", "NAT-002", "0711111111", "new@test.com"), default);

        Assert.NotNull(updated);
        Assert.Equal("STU-003-UPD", updated!.StudentNumber);
        Assert.Equal("New", updated.FirstName);
        Assert.Equal("Name", updated.LastName);
    }

    [Fact]
    public async Task DeleteAsync_removes_student()
    {
        var student = new Student { Id = Guid.NewGuid(), StudentNumber = "STU-004", FirstName = "Del", LastName = "Name" };
        var repo = new FakeStudentRepository(student);
        var service = new StudentService(repo);

        var result = await service.DeleteAsync(student.Id);

        Assert.True(result);
        Assert.Empty(repo.Students);
    }

    [Fact]
    public async Task DeleteAsync_returns_false_when_not_found()
    {
        var repo = new FakeStudentRepository();
        var service = new StudentService(repo);

        var result = await service.DeleteAsync(Guid.NewGuid());

        Assert.False(result);
    }

    private sealed class FakeStudentRepository : IStudentRepository
    {
        public List<Student> Students { get; } = new();

        public FakeStudentRepository() { }

        public FakeStudentRepository(Student student)
        {
            Students.Add(student);
        }

        public Task<IReadOnlyList<Student>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Student>>(Students);

        public Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<Student?>(Students.SingleOrDefault(x => x.Id == id));

        public Task AddAsync(Student student, CancellationToken cancellationToken = default)
        {
            Students.Add(student);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Student student, CancellationToken cancellationToken = default)
        {
            var existing = Students.SingleOrDefault(x => x.Id == student.Id);
            if (existing is not null)
            {
                Students.Remove(existing);
                Students.Add(student);
            }
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var existing = Students.SingleOrDefault(x => x.Id == id);
            if (existing is not null) Students.Remove(existing);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
