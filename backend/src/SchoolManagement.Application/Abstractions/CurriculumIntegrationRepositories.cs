using SchoolManagement.Domain.Academic;

namespace SchoolManagement.Application.Abstractions;

public interface IElectiveGroupRepository
{
    Task<IReadOnlyList<ElectiveGroup>> GetByCurriculumAsync(Guid curriculumId, CancellationToken cancellationToken = default);
    Task<ElectiveGroup?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(ElectiveGroup group, CancellationToken cancellationToken = default);
    Task UpdateAsync(ElectiveGroup group, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid curriculumId, int yearOfStudy, int semesterNumber, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ElectiveGroupCourse>> GetCoursesByGroupAsync(Guid electiveGroupId, CancellationToken cancellationToken = default);
    Task AddCourseAsync(ElectiveGroupCourse groupCourse, CancellationToken cancellationToken = default);
    Task RemoveCourseAsync(Guid groupCourseId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICurriculumVersionRepository
{
    Task<IReadOnlyList<CurriculumVersion>> GetByCurriculumAsync(Guid curriculumId, CancellationToken cancellationToken = default);
    Task<CurriculumVersion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(CurriculumVersion version, CancellationToken cancellationToken = default);
    Task UpdateAsync(CurriculumVersion version, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CurriculumVersionCourse>> GetCoursesByVersionAsync(Guid versionId, CancellationToken cancellationToken = default);
    Task AddCourseAsync(CurriculumVersionCourse versionCourse, CancellationToken cancellationToken = default);
    Task RemoveCourseAsync(Guid versionCourseId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICourseEquivalenceRepository
{
    Task<IReadOnlyList<CourseEquivalence>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<CourseEquivalence?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string externalCourseCode, CancellationToken cancellationToken = default);
    Task AddAsync(CourseEquivalence equivalence, CancellationToken cancellationToken = default);
    Task UpdateAsync(CourseEquivalence equivalence, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IStudentTransferCreditRepository
{
    Task<IReadOnlyList<StudentTransferCredit>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<StudentTransferCredit?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(Guid studentId, Guid courseEquivalenceId, CancellationToken cancellationToken = default);
    Task AddAsync(StudentTransferCredit transferCredit, CancellationToken cancellationToken = default);
    Task UpdateAsync(StudentTransferCredit transferCredit, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IProgrammeLearningOutcomeRepository
{
    Task<IReadOnlyList<ProgrammeLearningOutcome>> GetByProgrammeAsync(Guid programmeId, CancellationToken cancellationToken = default);
    Task<ProgrammeLearningOutcome?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(ProgrammeLearningOutcome plo, CancellationToken cancellationToken = default);
    Task UpdateAsync(ProgrammeLearningOutcome plo, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CoursePloMapping>> GetMappingsByPloAsync(Guid ploId, CancellationToken cancellationToken = default);
    Task AddMappingAsync(CoursePloMapping mapping, CancellationToken cancellationToken = default);
    Task RemoveMappingAsync(Guid mappingId, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ILmsCourseRepository
{
    Task<IReadOnlyList<LmsCourse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<LmsCourse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<LmsCourse?> GetByCourseAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task AddAsync(LmsCourse lmsCourse, CancellationToken cancellationToken = default);
    Task UpdateAsync(LmsCourse lmsCourse, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRegulatorImportRepository
{
    Task<IReadOnlyList<RegulatorImport>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<RegulatorImport?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(RegulatorImport import, CancellationToken cancellationToken = default);
    Task UpdateAsync(RegulatorImport import, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
