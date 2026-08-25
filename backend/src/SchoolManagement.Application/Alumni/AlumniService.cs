using SchoolManagement.Domain.Students;

namespace SchoolManagement.Application.Alumni;

public sealed class AlumniService(IAlumniRepository alumniRepository)
{
    public async Task<IReadOnlyList<Alumni>> GetActiveAsync(CancellationToken cancellationToken = default) =>
        await alumniRepository.GetActiveAsync(cancellationToken);

    public async Task<Alumni?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await alumniRepository.GetByIdAsync(id, cancellationToken);

    public async Task<Alumni?> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await alumniRepository.GetByStudentAsync(studentId, cancellationToken);

    public async Task<Alumni> RegisterAsync(Guid studentId, DateOnly graduationDate, string programme, CancellationToken cancellationToken = default)
    {
        var alumni = new Alumni
        {
            StudentId = studentId,
            GraduationDate = graduationDate,
            Programme = programme,
            IsActive = true
        };
        await alumniRepository.AddAsync(alumni, cancellationToken);
        await alumniRepository.SaveChangesAsync(cancellationToken);
        return alumni;
    }
}
