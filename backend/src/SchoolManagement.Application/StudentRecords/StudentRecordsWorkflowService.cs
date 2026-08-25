using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.StudentRecords;

public sealed class StudentRecordsWorkflowService(IStudentRecordsRepository repository)
{
    public async Task<StudentRecordDto?> GetAsync(Guid studentId, CancellationToken cancellationToken = default)
    {
        if (studentId == Guid.Empty)
            throw new ArgumentException("Student id is required.", nameof(studentId));

        var student = await repository.GetStudentAsync(studentId, cancellationToken);
        if (student is null)
            return null;

        var guardians = await repository.GetGuardiansAsync(studentId, cancellationToken);
        return Map(student, guardians);
    }

    public async Task<IReadOnlyList<StudentGuardianDto>> GetGuardiansAsync(
        Guid studentId,
        CancellationToken cancellationToken = default)
    {
        EnsureStudentId(studentId);
        if (!await repository.StudentExistsAsync(studentId, cancellationToken))
            throw new KeyNotFoundException("Student was not found.");

        return (await repository.GetGuardiansAsync(studentId, cancellationToken))
            .Select(Map)
            .ToList();
    }

    public async Task<StudentGuardianDto> AddGuardianAsync(
        Guid studentId,
        AddStudentGuardianRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureStudentId(studentId);
        if (request is null)
            throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.FullName))
            throw new ArgumentException("Guardian full name is required.", nameof(request));

        if (!await repository.StudentExistsAsync(studentId, cancellationToken))
            throw new KeyNotFoundException("Student was not found.");

        var existing = await repository.GetGuardiansAsync(studentId, cancellationToken);
        if (request.IsPrimary && existing.Any(x => x.IsPrimary))
            throw new InvalidOperationException("A primary guardian already exists for this student.");

        var guardian = new StudentGuardian
        {
            StudentId = studentId,
            FullName = request.FullName.Trim(),
            Relationship = Normalize(request.Relationship),
            PhoneNumber = Normalize(request.PhoneNumber),
            Email = Normalize(request.Email),
            IsPrimary = request.IsPrimary
        };

        await repository.AddGuardianAsync(guardian, cancellationToken);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(guardian);
    }

    public async Task RemoveGuardianAsync(
        Guid studentId,
        Guid guardianId,
        CancellationToken cancellationToken = default)
    {
        EnsureStudentId(studentId);
        if (guardianId == Guid.Empty)
            throw new ArgumentException("Guardian id is required.", nameof(guardianId));

        var guardian = await repository.GetGuardianAsync(studentId, guardianId, cancellationToken);
        if (guardian is null)
            throw new KeyNotFoundException("Guardian was not found for this student.");

        repository.RemoveGuardian(guardian);
        await repository.SaveChangesAsync(cancellationToken);
    }

    private static void EnsureStudentId(Guid studentId)
    {
        if (studentId == Guid.Empty)
            throw new ArgumentException("Student id is required.", nameof(studentId));
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static StudentRecordDto Map(Student student, IReadOnlyList<StudentGuardian> guardians) =>
        new(student.Id, student.StudentNumber, student.FirstName, student.LastName,
            student.OtherNames, student.DateOfBirth, student.Gender, student.NationalId,
            student.PhoneNumber, student.Email, student.Status, guardians.Select(Map).ToList());

    private static StudentGuardianDto Map(StudentGuardian guardian) =>
        new(guardian.Id, guardian.StudentId, guardian.FullName, guardian.Relationship,
            guardian.PhoneNumber, guardian.Email, guardian.IsPrimary);
}
