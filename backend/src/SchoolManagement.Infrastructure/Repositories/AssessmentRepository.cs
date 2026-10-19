using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Assessment;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class AssessmentRepository(SchoolManagementDbContext db) : IAssessmentRepository, SchoolManagement.Application.Assessment.IAssessmentRepository
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

    public Task<StudentAssessment?> GetStudentAssessmentByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.StudentAssessments.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<StudentAssessment> AddStudentAssessmentAsync(StudentAssessment assessment, CancellationToken cancellationToken = default)
    {
        db.StudentAssessments.Add(assessment);
        await db.SaveChangesAsync(cancellationToken);
        return assessment;
    }

    public async Task<bool> FinalizeStudentAssessmentAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var updated = await db.StudentAssessments
            .Where(x => x.Id == id && !x.IsFinalized)
            .ExecuteUpdateAsync(setters => setters.SetProperty(x => x.IsFinalized, true), cancellationToken);
        return updated == 1;
    }
}
