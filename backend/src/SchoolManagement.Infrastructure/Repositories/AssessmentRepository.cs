using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AssessmentRepository(SchoolManagementDbContext db) : IAssessmentRepository
{
    public async Task<IReadOnlyList<AssessmentPlan>> GetPlansAsync(Guid? courseId = null, CancellationToken cancellationToken = default)
    {
        var query = db.AssessmentPlans.AsNoTracking().Where(x => x.IsActive);
        if (courseId.HasValue) query = query.Where(x => x.CourseId == courseId.Value);
        return await query.OrderBy(x => x.CourseId).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StudentAssessment>> GetStudentAssessmentsAsync(Guid courseRegistrationId, CancellationToken cancellationToken = default) =>
        await db.StudentAssessments.AsNoTracking()
            .Where(x => x.CourseRegistrationId == courseRegistrationId)
            .OrderBy(x => x.RecordedAt)
            .ToListAsync(cancellationToken);

    public async Task<StudentAssessment> AddStudentAssessmentAsync(StudentAssessment assessment, CancellationToken cancellationToken = default)
    {
        db.StudentAssessments.Add(assessment);
        await db.SaveChangesAsync(cancellationToken);
        return assessment;
    }
}
