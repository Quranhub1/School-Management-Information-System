using Microsoft.EntityFrameworkCore;
using SchoolManagement.Domain.Students;
using SchoolManagement.Infrastructure.Persistence;

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

public sealed class StudentService(SchoolManagementDbContext db)
{
    public async Task<IReadOnlyList<Student>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.Students.AsNoTracking().OrderBy(x => x.StudentNumber).ToListAsync(cancellationToken);

    public async Task<Student?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await db.Students.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

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

        db.Students.Add(student);
        await db.SaveChangesAsync(cancellationToken);
        return student;
    }
}
