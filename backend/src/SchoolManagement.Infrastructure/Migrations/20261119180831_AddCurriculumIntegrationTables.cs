using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCurriculumIntegrationTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourseEquivalences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalCourseCode = table.Column<string>(type: "text", nullable: false),
                    ExternalCourseName = table.Column<string>(type: "text", nullable: false),
                    ExternalInstitution = table.Column<string>(type: "text", nullable: false),
                    InternalCourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreditsAccepted = table.Column<int>(type: "integer", nullable: false),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourseEquivalences", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CoursePloMappings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProgrammeLearningOutcomeId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContributionLevel = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoursePloMappings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CurriculumVersionCourses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CurriculumVersionId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    YearOfStudy = table.Column<int>(type: "integer", nullable: false),
                    SemesterNumber = table.Column<int>(type: "integer", nullable: false),
                    IsCore = table.Column<bool>(type: "boolean", nullable: false),
                    ElectiveGroupId = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CurriculumVersionCourses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CurriculumVersions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CurriculumId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    MinimumCredits = table.Column<int>(type: "integer", nullable: false),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    ProgrammeType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    ChangeNotes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CurriculumVersions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ElectiveGroupCourses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ElectiveGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsCoreWithinGroup = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElectiveGroupCourses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ElectiveGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CurriculumId = table.Column<Guid>(type: "uuid", nullable: false),
                    YearOfStudy = table.Column<int>(type: "integer", nullable: false),
                    SemesterNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    MinCredits = table.Column<int>(type: "integer", nullable: false),
                    MinCourses = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElectiveGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "LmsCourses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                    LmsPlatform = table.Column<string>(type: "text", nullable: false),
                    LmsCourseId = table.Column<string>(type: "text", nullable: false),
                    LmsCourseUrl = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LmsCourses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ProgrammeLearningOutcomes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProgrammeId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Sequence = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProgrammeLearningOutcomes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RegulatorImports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RegulatorCode = table.Column<string>(type: "text", nullable: false),
                    ImportType = table.Column<string>(type: "text", nullable: false),
                    ImportedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RecordsProcessed = table.Column<int>(type: "integer", nullable: false),
                    RecordsInserted = table.Column<int>(type: "integer", nullable: false),
                    RecordsSkipped = table.Column<int>(type: "integer", nullable: false),
                    ImportFileRef = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegulatorImports", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StudentTransferCredits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StudentId = table.Column<Guid>(type: "uuid", nullable: false),
                    CourseEquivalenceId = table.Column<Guid>(type: "uuid", nullable: false),
                    SemesterId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalTranscriptRef = table.Column<string>(type: "text", nullable: false),
                    GrantedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    GrantedBy = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentTransferCredits", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourseEquivalences");

            migrationBuilder.DropTable(
                name: "CoursePloMappings");

            migrationBuilder.DropTable(
                name: "CurriculumVersionCourses");

            migrationBuilder.DropTable(
                name: "CurriculumVersions");

            migrationBuilder.DropTable(
                name: "ElectiveGroupCourses");

            migrationBuilder.DropTable(
                name: "ElectiveGroups");

            migrationBuilder.DropTable(
                name: "LmsCourses");

            migrationBuilder.DropTable(
                name: "ProgrammeLearningOutcomes");

            migrationBuilder.DropTable(
                name: "RegulatorImports");

            migrationBuilder.DropTable(
                name: "StudentTransferCredits");
        }
    }
}