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

public sealed record UpdateStudentRequest(
    Guid Id,
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

    public async Task<Student?> UpdateAsync(UpdateStudentRequest request, CancellationToken cancellationToken = default)
    {
        var student = await students.GetByIdAsync(request.Id, cancellationToken);
        if (student is null) return null;

        student.StudentNumber = request.StudentNumber.Trim();
        student.FirstName = request.FirstName.Trim();
        student.LastName = request.LastName.Trim();
        student.OtherNames = request.OtherNames?.Trim();
        student.DateOfBirth = request.DateOfBirth;
        student.Gender = request.Gender?.Trim();
        student.NationalId = request.NationalId?.Trim();
        student.PhoneNumber = request.PhoneNumber?.Trim();
        student.Email = request.Email?.Trim();

        await students.UpdateAsync(student, cancellationToken);
        return student;
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var student = await students.GetByIdAsync(id, cancellationToken);
        if (student is null) return false;

        await students.DeleteAsync(id, cancellationToken);
        return true;
    }
}
