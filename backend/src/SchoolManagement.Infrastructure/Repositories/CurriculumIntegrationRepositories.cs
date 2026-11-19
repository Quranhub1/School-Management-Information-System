using Microsoft.EntityFrameworkCore;
using SchoolManagement.Application.Abstractions;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Infrastructure.Persistence;

namespace SchoolManagement.Infrastructure.Repositories;

public sealed class ElectiveGroupRepository(SchoolManagementDbContext db) : IElectiveGroupRepository
{
    public async Task<IReadOnlyList<ElectiveGroup>> GetByCurriculumAsync(Guid curriculumId, CancellationToken cancellationToken = default) =>
        await db.ElectiveGroups.AsNoTracking().Where(x => x.CurriculumId == curriculumId && x.IsActive).OrderBy(x => x.YearOfStudy).ThenBy(x => x.SemesterNumber).ToListAsync(cancellationToken);

    public Task<ElectiveGroup?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.ElectiveGroups.FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);

    public Task AddAsync(ElectiveGroup group, CancellationToken cancellationToken = default) => db.ElectiveGroups.AddAsync(group, cancellationToken).AsTask();

    public Task UpdateAsync(ElectiveGroup group, CancellationToken cancellationToken = default)
    {
        db.ElectiveGroups.Update(group);
        return Task.CompletedTask;
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.ElectiveGroups.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is not null) entity.IsActive = false;
    }

    public Task<bool> ExistsAsync(Guid curriculumId, int yearOfStudy, int semesterNumber, CancellationToken cancellationToken = default) =>
        db.ElectiveGroups.AnyAsync(x => x.CurriculumId == curriculumId && x.YearOfStudy == yearOfStudy && x.SemesterNumber == semesterNumber && x.IsActive, cancellationToken);

    public async Task<IReadOnlyList<ElectiveGroupCourse>> GetCoursesByGroupAsync(Guid electiveGroupId, CancellationToken cancellationToken = default) =>
        await db.ElectiveGroupCourses.AsNoTracking().Where(x => x.ElectiveGroupId == electiveGroupId).ToListAsync(cancellationToken);

    public Task AddCourseAsync(ElectiveGroupCourse groupCourse, CancellationToken cancellationToken = default) => db.ElectiveGroupCourses.AddAsync(groupCourse, cancellationToken).AsTask();

    public async Task RemoveCourseAsync(Guid groupCourseId, CancellationToken cancellationToken = default)
    {
        var entity = await db.ElectiveGroupCourses.FirstOrDefaultAsync(x => x.Id == groupCourseId, cancellationToken);
        if (entity is not null) db.ElectiveGroupCourses.Remove(entity);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}

public sealed class CurriculumVersionRepository(SchoolManagementDbContext db) : ICurriculumVersionRepository
{
    public async Task<IReadOnlyList<CurriculumVersion>> GetByCurriculumAsync(Guid curriculumId, CancellationToken cancellationToken = default) =>
        await db.CurriculumVersions.AsNoTracking().Where(x => x.CurriculumId == curriculumId).OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);

    public Task<CurriculumVersion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.CurriculumVersions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(CurriculumVersion version, CancellationToken cancellationToken = default) => db.CurriculumVersions.AddAsync(version, cancellationToken).AsTask();

    public Task UpdateAsync(CurriculumVersion version, CancellationToken cancellationToken = default)
    {
        db.CurriculumVersions.Update(version);
        return Task.CompletedTask;
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.CurriculumVersions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is not null) db.CurriculumVersions.Remove(entity);
    }

    public async Task<IReadOnlyList<CurriculumVersionCourse>> GetCoursesByVersionAsync(Guid versionId, CancellationToken cancellationToken = default) =>
        await db.CurriculumVersionCourses.AsNoTracking().Where(x => x.CurriculumVersionId == versionId).ToListAsync(cancellationToken);

    public Task AddCourseAsync(CurriculumVersionCourse versionCourse, CancellationToken cancellationToken = default) => db.CurriculumVersionCourses.AddAsync(versionCourse, cancellationToken).AsTask();

    public async Task RemoveCourseAsync(Guid versionCourseId, CancellationToken cancellationToken = default)
    {
        var entity = await db.CurriculumVersionCourses.FirstOrDefaultAsync(x => x.Id == versionCourseId, cancellationToken);
        if (entity is not null) db.CurriculumVersionCourses.Remove(entity);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}

public sealed class CourseEquivalenceRepository(SchoolManagementDbContext db) : ICourseEquivalenceRepository
{
    public async Task<IReadOnlyList<CourseEquivalence>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.CourseEquivalences.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.ExternalCourseCode).ToListAsync(cancellationToken);

    public Task<CourseEquivalence?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.CourseEquivalences.FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);

    public Task<bool> ExistsAsync(string externalCourseCode, CancellationToken cancellationToken = default) =>
        db.CourseEquivalences.AnyAsync(x => x.ExternalCourseCode == externalCourseCode && x.IsActive, cancellationToken);

    public Task AddAsync(CourseEquivalence equivalence, CancellationToken cancellationToken = default) => db.CourseEquivalences.AddAsync(equivalence, cancellationToken).AsTask();

    public Task UpdateAsync(CourseEquivalence equivalence, CancellationToken cancellationToken = default)
    {
        db.CourseEquivalences.Update(equivalence);
        return Task.CompletedTask;
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.CourseEquivalences.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is not null) entity.IsActive = false;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}

public sealed class StudentTransferCreditRepository(SchoolManagementDbContext db) : IStudentTransferCreditRepository
{
    public async Task<IReadOnlyList<StudentTransferCredit>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await db.StudentTransferCredits.AsNoTracking().Where(x => x.StudentId == studentId && x.IsActive).ToListAsync(cancellationToken);

    public Task<StudentTransferCredit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.StudentTransferCredits.FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);

    public Task<bool> ExistsAsync(Guid studentId, Guid courseEquivalenceId, CancellationToken cancellationToken = default) =>
        db.StudentTransferCredits.AnyAsync(x => x.StudentId == studentId && x.CourseEquivalenceId == courseEquivalenceId && x.IsActive, cancellationToken);

    public Task AddAsync(StudentTransferCredit transferCredit, CancellationToken cancellationToken = default) => db.StudentTransferCredits.AddAsync(transferCredit, cancellationToken).AsTask();

    public Task UpdateAsync(StudentTransferCredit transferCredit, CancellationToken cancellationToken = default)
    {
        db.StudentTransferCredits.Update(transferCredit);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}

public sealed class ProgrammeLearningOutcomeRepository(SchoolManagementDbContext db) : IProgrammeLearningOutcomeRepository
{
    public async Task<IReadOnlyList<ProgrammeLearningOutcome>> GetByProgrammeAsync(Guid programmeId, CancellationToken cancellationToken = default) =>
        await db.ProgrammeLearningOutcomes.AsNoTracking().Where(x => x.ProgrammeId == programmeId && x.IsActive).OrderBy(x => x.Sequence).ToListAsync(cancellationToken);

    public Task<ProgrammeLearningOutcome?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.ProgrammeLearningOutcomes.FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);

    public Task AddAsync(ProgrammeLearningOutcome plo, CancellationToken cancellationToken = default) => db.ProgrammeLearningOutcomes.AddAsync(plo, cancellationToken).AsTask();

    public Task UpdateAsync(ProgrammeLearningOutcome plo, CancellationToken cancellationToken = default)
    {
        db.ProgrammeLearningOutcomes.Update(plo);
        return Task.CompletedTask;
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.ProgrammeLearningOutcomes.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is not null) entity.IsActive = false;
    }

    public async Task<IReadOnlyList<CoursePloMapping>> GetMappingsByPloAsync(Guid ploId, CancellationToken cancellationToken = default) =>
        await db.CoursePloMappings.AsNoTracking().Where(x => x.ProgrammeLearningOutcomeId == ploId && x.IsActive).ToListAsync(cancellationToken);

    public Task AddMappingAsync(CoursePloMapping mapping, CancellationToken cancellationToken = default) => db.CoursePloMappings.AddAsync(mapping, cancellationToken).AsTask();

    public async Task RemoveMappingAsync(Guid mappingId, CancellationToken cancellationToken = default)
    {
        var entity = await db.CoursePloMappings.FirstOrDefaultAsync(x => x.Id == mappingId, cancellationToken);
        if (entity is not null) entity.IsActive = false;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}

public sealed class LmsCourseRepository(SchoolManagementDbContext db) : ILmsCourseRepository
{
    public async Task<IReadOnlyList<LmsCourse>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.LmsCourses.AsNoTracking().Where(x => x.IsActive).OrderBy(x => x.LmsPlatform).ToListAsync(cancellationToken);

    public Task<LmsCourse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.LmsCourses.FirstOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);

    public Task<LmsCourse?> GetByCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        db.LmsCourses.FirstOrDefaultAsync(x => x.CourseId == courseId && x.IsActive, cancellationToken);

    public Task AddAsync(LmsCourse lmsCourse, CancellationToken cancellationToken = default) => db.LmsCourses.AddAsync(lmsCourse, cancellationToken).AsTask();

    public Task UpdateAsync(LmsCourse lmsCourse, CancellationToken cancellationToken = default)
    {
        db.LmsCourses.Update(lmsCourse);
        return Task.CompletedTask;
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await db.LmsCourses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (entity is not null) entity.IsActive = false;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}

public sealed class RegulatorImportRepository(SchoolManagementDbContext db) : IRegulatorImportRepository
{
    public async Task<IReadOnlyList<RegulatorImport>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await db.RegulatorImports.AsNoTracking().OrderByDescending(x => x.ImportedAt).ToListAsync(cancellationToken);

    public Task<RegulatorImport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.RegulatorImports.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task AddAsync(RegulatorImport import, CancellationToken cancellationToken = default) => db.RegulatorImports.AddAsync(import, cancellationToken).AsTask();

    public Task UpdateAsync(RegulatorImport import, CancellationToken cancellationToken = default)
    {
        db.RegulatorImports.Update(import);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
