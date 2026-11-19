using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261119140000_AddCurriculumIntegrationsEntities")]
public sealed class AddCurriculumIntegrationsEntities : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
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
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ElectiveGroups", x => x.Id);
                table.ForeignKey(
                    name: "FK_ElectiveGroups_Curricula_CurriculumId",
                    column: x => x.CurriculumId,
                    principalTable: "Curricula",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "ElectiveGroupCourses",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                ElectiveGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                IsCoreWithinGroup = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ElectiveGroupCourses", x => x.Id);
                table.ForeignKey(
                    name: "FK_ElectiveGroupCourses_Courses_CourseId",
                    column: x => x.CourseId,
                    principalTable: "Courses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_ElectiveGroupCourses_ElectiveGroups_ElectiveGroupId",
                    column: x => x.ElectiveGroupId,
                    principalTable: "ElectiveGroups",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                Status = table.Column<string>(type: "text", nullable: false, defaultValue: "Draft"),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                CreatedBy = table.Column<string>(type: "text", nullable: true),
                ChangeNotes = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CurriculumVersions", x => x.Id);
                table.ForeignKey(
                    name: "FK_CurriculumVersions_Curricula_CurriculumId",
                    column: x => x.CurriculumId,
                    principalTable: "Curricula",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                table.ForeignKey(
                    name: "FK_CurriculumVersionCourses_CurriculumVersions_CurriculumVersionId",
                    column: x => x.CurriculumVersionId,
                    principalTable: "CurriculumVersions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_CurriculumVersionCourses_Courses_CourseId",
                    column: x => x.CourseId,
                    principalTable: "Courses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_CurriculumVersionCourses_ElectiveGroups_ElectiveGroupId",
                    column: x => x.ElectiveGroupId,
                    principalTable: "ElectiveGroups",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

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
                IsMandatory = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                CreatedBy = table.Column<string>(type: "text", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CourseEquivalences", x => x.Id);
                table.ForeignKey(
                    name: "FK_CourseEquivalences_Courses_InternalCourseId",
                    column: x => x.InternalCourseId,
                    principalTable: "Courses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_StudentTransferCredits", x => x.Id);
                table.ForeignKey(
                    name: "FK_StudentTransferCredits_CourseEquivalences_CourseEquivalenceId",
                    column: x => x.CourseEquivalenceId,
                    principalTable: "CourseEquivalences",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ProgrammeLearningOutcomes", x => x.Id);
                table.ForeignKey(
                    name: "FK_ProgrammeLearningOutcomes_Programmes_ProgrammeId",
                    column: x => x.ProgrammeId,
                    principalTable: "Programmes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "CoursePloMappings",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                CourseId = table.Column<Guid>(type: "uuid", nullable: false),
                ProgrammeLearningOutcomeId = table.Column<Guid>(type: "uuid", nullable: false),
                ContributionLevel = table.Column<string>(type: "text", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CoursePloMappings", x => x.Id);
                table.ForeignKey(
                    name: "FK_CoursePloMappings_Courses_CourseId",
                    column: x => x.CourseId,
                    principalTable: "Courses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_CoursePloMappings_ProgrammeLearningOutcomes_ProgrammeLearningOutcomeId",
                    column: x => x.ProgrammeLearningOutcomeId,
                    principalTable: "ProgrammeLearningOutcomes",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                Status = table.Column<string>(type: "text", nullable: false, defaultValue: "Created"),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                CreatedBy = table.Column<string>(type: "text", nullable: true),
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_LmsCourses", x => x.Id);
                table.ForeignKey(
                    name: "FK_LmsCourses_Courses_CourseId",
                    column: x => x.CourseId,
                    principalTable: "Courses",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
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
                IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_RegulatorImports", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_ElectiveGroups_CurriculumId",
            table: "ElectiveGroups",
            column: "CurriculumId");

        migrationBuilder.CreateIndex(
            name: "IX_ElectiveGroupCourses_CourseId",
            table: "ElectiveGroupCourses",
            column: "CourseId");

        migrationBuilder.CreateIndex(
            name: "IX_ElectiveGroupCourses_ElectiveGroupId",
            table: "ElectiveGroupCourses",
            column: "ElectiveGroupId");

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumVersionCourses_CourseId",
            table: "CurriculumVersionCourses",
            column: "CourseId");

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumVersionCourses_CurriculumVersionId",
            table: "CurriculumVersionCourses",
            column: "CurriculumVersionId");

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumVersionCourses_ElectiveGroupId",
            table: "CurriculumVersionCourses",
            column: "ElectiveGroupId");

        migrationBuilder.CreateIndex(
            name: "IX_CurriculumVersions_CurriculumId",
            table: "CurriculumVersions",
            column: "CurriculumId");

        migrationBuilder.CreateIndex(
            name: "IX_CourseEquivalences_InternalCourseId",
            table: "CourseEquivalences",
            column: "InternalCourseId");

        migrationBuilder.CreateIndex(
            name: "IX_StudentTransferCredits_CourseEquivalenceId",
            table: "StudentTransferCredits",
            column: "CourseEquivalenceId");

        migrationBuilder.CreateIndex(
            name: "IX_CoursePloMappings_CourseId",
            table: "CoursePloMappings",
            column: "CourseId");

        migrationBuilder.CreateIndex(
            name: "IX_CoursePloMappings_ProgrammeLearningOutcomeId",
            table: "CoursePloMappings",
            column: "ProgrammeLearningOutcomeId");

        migrationBuilder.CreateIndex(
            name: "IX_LmsCourses_CourseId",
            table: "LmsCourses",
            column: "CourseId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("RegulatorImports");
        migrationBuilder.DropTable("LmsCourses");
        migrationBuilder.DropTable("CoursePloMappings");
        migrationBuilder.DropTable("ProgrammeLearningOutcomes");
        migrationBuilder.DropTable("StudentTransferCredits");
        migrationBuilder.DropTable("CourseEquivalences");
        migrationBuilder.DropTable("CurriculumVersionCourses");
        migrationBuilder.DropTable("CurriculumVersions");
        migrationBuilder.DropTable("ElectiveGroupCourses");
        migrationBuilder.DropTable("ElectiveGroups");
    }
}
