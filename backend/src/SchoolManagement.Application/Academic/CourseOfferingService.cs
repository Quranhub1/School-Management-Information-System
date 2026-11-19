using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Academic;

public sealed record CreateCourseOfferingRequest(Guid CourseId, Guid SemesterId, Guid ProgrammeId, string OfferingCode, int? Capacity);
public sealed record UpdateCourseOfferingRequest(string OfferingCode, int? Capacity, bool IsActive);

public sealed class CourseOfferingService(
    ICourseRepository courses,
    ISemesterRepository semesters,
    IProgrammeRepository programmes)
{
    public async Task<IReadOnlyList<CourseOffering>> GetAllAsync(CancellationToken ct = default) => [];

    public async Task<(bool Success, string? Error, Guid? OfferingId)> CreateOfferingAsync(CreateCourseOfferingRequest request, CancellationToken ct = default)
    {
        var course = await courses.GetByIdAsync(request.CourseId, ct);
        if (course is null) return (false, "Course not found.", null);
        var semester = await semesters.GetByIdAsync(request.SemesterId, ct);
        if (semester is null) return (false, "Semester not found.", null);
        var programme = await programmes.GetByIdAsync(request.ProgrammeId, ct);
        if (programme is null) return (false, "Programme not found.", null);

        var offering = new CourseOffering
        {
            CourseId = request.CourseId,
            SemesterId = request.SemesterId,
            ProgrammeId = request.ProgrammeId,
            OfferingCode = request.OfferingCode,
            Capacity = request.Capacity,
            Status = "Planned",
            IsActive = true
        };

        return (true, null, offering.Id);
    }

    public async Task<(bool Success, string? Error)> SetOfferingActiveAsync(Guid offeringId, bool isActive, CancellationToken ct = default)
    {
        return (true, null);
    }
}
