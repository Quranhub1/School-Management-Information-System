using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SchoolManagement.Application.Timetable;
using SchoolManagement.Domain.Academic;
using SchoolManagement.Domain.Staff;
using SchoolManagement.Infrastructure.Persistence;
using SchoolManagement.Infrastructure.Timetable;
using Xunit;

namespace SchoolManagement.Infrastructure.Tests.Timetable;

public sealed class TimetableGeneratorServiceTests
{
    [Fact]
    public async Task GenerateAsync_schedules_every_course_mapped_to_a_programme_year_class()
    {
        await using var db = CreateContext();
        var data = SeedCohort(db, includeAllOfferings: true);
        await db.SaveChangesAsync();

        var result = await new TimetableGeneratorService(db).GenerateAsync(Request(data));

        Assert.Empty(result.Unscheduled);
        Assert.Equal(
            new[] { data.CourseOne.Id, data.CourseTwo.Id }.OrderBy(id => id),
            result.Entries.Select(entry => entry.CourseId).Distinct().OrderBy(id => id));
        Assert.All(result.Entries, entry => Assert.Equal(data.Group.Id, entry.TeachingGroupId));
    }

    [Fact]
    public async Task GenerateAsync_retains_existing_class_timetable_when_a_mapped_course_has_no_active_offering()
    {
        await using var db = CreateContext();
        var data = SeedCohort(db, includeAllOfferings: false);
        var existing = new TimetableEntry
        {
            TeachingGroupId = data.Group.Id,
            CourseId = data.CourseOne.Id,
            TeacherId = data.Teacher.Id,
            StaffMemberId = data.Teacher.Id,
            DayOfWeek = DayOfWeek.Monday,
            StartTime = new TimeOnly(8, 0),
            EndTime = new TimeOnly(10, 0),
            Room = "Room 101",
            SessionType = "Lecture"
        };
        db.TimetableEntries.Add(existing);
        await db.SaveChangesAsync();

        var result = await new TimetableGeneratorService(db).GenerateAsync(Request(data));

        Assert.Empty(result.Entries);
        Assert.Contains(result.Unscheduled, item => item.Contains("missing course offerings", StringComparison.OrdinalIgnoreCase));
        Assert.True((await db.TimetableEntries.SingleAsync(entry => entry.Id == existing.Id)).IsActive);
    }

    [Fact]
    public void TeachingGroup_model_supports_cohort_identity_without_removing_legacy_offering_link()
    {
        using var db = CreateContext();
        var entity = db.Model.FindEntityType(typeof(TeachingGroup));

        Assert.NotNull(entity);
        Assert.NotNull(entity!.FindProperty(nameof(TeachingGroup.CourseOfferingId)));
        Assert.NotNull(entity.FindProperty(nameof(TeachingGroup.ProgrammeId)));
        Assert.NotNull(entity.FindProperty(nameof(TeachingGroup.CurriculumId)));
        Assert.NotNull(entity.FindProperty(nameof(TeachingGroup.YearOfStudy)));
        Assert.NotNull(entity.FindProperty(nameof(TeachingGroup.SemesterId)));
    }

    private static GenerateTimetableRequest Request(TestData data) =>
        new(data.Semester.Id, null, 15, "Manual", data.Curriculum.Id, 1, 1, data.Programme.Id, new[] { data.Group.Id });

    private static TestData SeedCohort(SchoolManagementDbContext db, bool includeAllOfferings)
    {
        var academicYear = new AcademicYear
        {
            Name = "2026/2027",
            StartDate = new DateOnly(2026, 7, 1),
            EndDate = new DateOnly(2027, 6, 30),
            IsCurrent = true
        };
        var semester = new Semester
        {
            AcademicYearId = academicYear.Id,
            Name = "Semester 1",
            Sequence = 1,
            StartDate = new DateOnly(2026, 7, 1),
            EndDate = new DateOnly(2026, 12, 31),
            IsCurrent = true
        };
        var programme = new Programme { Code = "CPH", Name = "Certificate in Pharmacy", Award = "Certificate" };
        var curriculum = new Curriculum
        {
            ProgrammeId = programme.Id,
            Version = "2026",
            Title = "CPH Curriculum",
            EffectiveFrom = new DateOnly(2026, 1, 1),
            Status = "Approved"
        };
        var courseOne = new Course { Code = "CPH101", Name = "Anatomy", CreditUnits = 1 };
        var courseTwo = new Course { Code = "CPH102", Name = "Physiology", CreditUnits = 1 };
        var teacher = new StaffMember
        {
            StaffNumber = "T-001",
            FirstName = "Test",
            LastName = "Tutor",
            EmploymentType = "Full-time",
            StaffType = StaffType.Teaching
        };
        var offeringOne = new CourseOffering
        {
            CourseId = courseOne.Id,
            SemesterId = semester.Id,
            ProgrammeId = programme.Id,
            OfferingCode = "CPH101-2026-S1"
        };
        var offeringTwo = new CourseOffering
        {
            CourseId = courseTwo.Id,
            SemesterId = semester.Id,
            ProgrammeId = programme.Id,
            OfferingCode = "CPH102-2026-S1"
        };
        var group = new TeachingGroup
        {
            CourseOfferingId = offeringOne.Id,
            ProgrammeId = programme.Id,
            CurriculumId = curriculum.Id,
            YearOfStudy = 1,
            SemesterId = semester.Id,
            GroupCode = "A",
            Name = "CPH Year 1"
        };

        db.AcademicYears.Add(academicYear);
        db.Semesters.Add(semester);
        db.Programmes.Add(programme);
        db.Curricula.Add(curriculum);
        db.Courses.AddRange(courseOne, courseTwo);
        db.CurriculumCourses.AddRange(
            new CurriculumCourse { CurriculumId = curriculum.Id, CourseId = courseOne.Id, YearOfStudy = 1, SemesterNumber = 1 },
            new CurriculumCourse { CurriculumId = curriculum.Id, CourseId = courseTwo.Id, YearOfStudy = 1, SemesterNumber = 1 });
        db.CourseOfferings.Add(offeringOne);
        if (includeAllOfferings) db.CourseOfferings.Add(offeringTwo);
        db.TeachingGroups.Add(group);
        db.StaffMembers.Add(teacher);
        db.TeachingAllocations.AddRange(
            new TeachingAllocation { StaffMemberId = teacher.Id, CourseId = courseOne.Id, SemesterId = semester.Id, Role = "Lead" },
            new TeachingAllocation { StaffMemberId = teacher.Id, CourseId = courseTwo.Id, SemesterId = semester.Id, Role = "Lead" });

        return new TestData(semester, programme, curriculum, courseOne, courseTwo, teacher, group);
    }

    private static SchoolManagementDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SchoolManagementDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new SchoolManagementDbContext(options);
    }

    private sealed record TestData(
        Semester Semester,
        Programme Programme,
        Curriculum Curriculum,
        Course CourseOne,
        Course CourseTwo,
        StaffMember Teacher,
        TeachingGroup Group);
}
