using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Students;

public sealed record CreateStudentRequest(
    string StudentNumber,
    string FirstName,
    string LastName,
    string? OtherNames = null,
    DateOnly? DateOfBirth = null,
    string? Gender = null,
    string? NationalId = null,
    string? PhoneNumber = null,
    string? Email = null);

public sealed class StudentService(IStudentRepository students)
{
    public Task<IReadOnlyList<Student>> GetAllAsync(CancellationToken cancellationToken = default) =>
        students.GetAllAsync(cancellationToken);

    public Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        students.GetByIdAsync(id, cancellationToken);

    public async Task<Student> CreateAsync(CreateStudentRequest request, CancellationToken cancellationToken = default)
    {
        var student = new Student
        {
            StudentNumber = request.StudentNumber.Trim(),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            OtherNames = request.OtherNames?.Trim(),
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender?.Trim(),
            NationalId = request.NationalId?.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            Email = request.Email?.Trim()
        };

        await students.AddAsync(student, cancellationToken);
        await students.SaveChangesAsync(cancellationToken);
        return student;
    }
}
