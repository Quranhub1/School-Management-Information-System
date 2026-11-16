using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261117100000_AddCurriculumLogbooksAndUhpabFeeReferences")]
public sealed class AddCurriculumLogbooksAndUhpabFeeReferences : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE TABLE "LogbookRequirements" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "CurriculumId" uuid NOT NULL,
                "Title" text NOT NULL,
                "Description" text NULL,
                "YearOfStudy" integer NOT NULL,
                "SemesterNumber" integer NOT NULL,
                "RequiredQuantity" integer NOT NULL DEFAULT 1,
                "IsMandatory" boolean NOT NULL DEFAULT TRUE,
                "IsActive" boolean NOT NULL DEFAULT TRUE,
                CONSTRAINT "FK_LogbookRequirements_Curricula_CurriculumId"
                    FOREIGN KEY ("CurriculumId") REFERENCES "Curricula" ("Id") ON DELETE CASCADE,
                CONSTRAINT "CK_LogbookRequirements_Year" CHECK ("YearOfStudy" > 0),
                CONSTRAINT "CK_LogbookRequirements_Semester" CHECK ("SemesterNumber" > 0),
                CONSTRAINT "CK_LogbookRequirements_Quantity" CHECK ("RequiredQuantity" > 0)
            );

            CREATE TABLE "LogbookCompetencyRequirements" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "LogbookRequirementId" uuid NOT NULL,
                "Code" text NOT NULL,
                "Name" text NOT NULL,
                "RequiredCount" integer NOT NULL DEFAULT 1,
                "IsMandatory" boolean NOT NULL DEFAULT TRUE,
                "IsActive" boolean NOT NULL DEFAULT TRUE,
                CONSTRAINT "FK_LogbookCompetencyRequirements_LogbookRequirements_LogbookRequirementId"
                    FOREIGN KEY ("LogbookRequirementId") REFERENCES "LogbookRequirements" ("Id") ON DELETE CASCADE,
                CONSTRAINT "CK_LogbookCompetencyRequirements_RequiredCount" CHECK ("RequiredCount" > 0)
            );

            CREATE TABLE "StudentLogbooks" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "StudentId" uuid NOT NULL,
                "LogbookRequirementId" uuid NOT NULL,
                "SerialNumber" text NOT NULL,
                "IssuedOn" date NOT NULL,
                "SubmittedOn" date NULL,
                "Status" text NOT NULL,
                "IssuedBy" text NULL,
                "Remarks" text NULL,
                CONSTRAINT "FK_StudentLogbooks_Students_StudentId"
                    FOREIGN KEY ("StudentId") REFERENCES "Students" ("Id") ON DELETE RESTRICT,
                CONSTRAINT "FK_StudentLogbooks_LogbookRequirements_LogbookRequirementId"
                    FOREIGN KEY ("LogbookRequirementId") REFERENCES "LogbookRequirements" ("Id") ON DELETE RESTRICT
            );

            CREATE TABLE "StudentLogbookCompetencies" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "StudentLogbookId" uuid NOT NULL,
                "CompetencyRequirementId" uuid NOT NULL,
                "StudentPlacementId" uuid NULL,
                "Outcome" text NOT NULL,
                "AssessedOn" date NULL,
                "AssessorName" text NULL,
                "AssessorRole" text NULL,
                "EvidenceReference" text NULL,
                "Remarks" text NULL,
                CONSTRAINT "FK_StudentLogbookCompetencies_StudentLogbooks_StudentLogbookId"
                    FOREIGN KEY ("StudentLogbookId") REFERENCES "StudentLogbooks" ("Id") ON DELETE CASCADE,
                CONSTRAINT "FK_StudentLogbookCompetencies_LogbookCompetencyRequirements_CompetencyRequirementId"
                    FOREIGN KEY ("CompetencyRequirementId") REFERENCES "LogbookCompetencyRequirements" ("Id") ON DELETE RESTRICT,
                CONSTRAINT "FK_StudentLogbookCompetencies_StudentPlacements_StudentPlacementId"
                    FOREIGN KEY ("StudentPlacementId") REFERENCES "StudentPlacements" ("Id") ON DELETE SET NULL
            );

            CREATE TABLE "UhpabFeeReferences" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "Category" text NOT NULL,
                "ProgrammeCode" text NULL,
                "ProgrammeName" text NULL,
                "Description" text NOT NULL,
                "Amount" numeric(18,2) NOT NULL,
                "Currency" character varying(3) NOT NULL DEFAULT 'UGX',
                "SourceUrl" text NOT NULL,
                "SourceTitle" text NOT NULL,
                "SourceCheckedOn" date NOT NULL,
                "EffectiveFrom" date NOT NULL,
                "EffectiveTo" date NULL,
                "IsActive" boolean NOT NULL DEFAULT TRUE,
                CONSTRAINT "CK_UhpabFeeReferences_Amount" CHECK ("Amount" >= 0),
                CONSTRAINT "CK_UhpabFeeReferences_EffectiveDates" CHECK ("EffectiveTo" IS NULL OR "EffectiveTo" >= "EffectiveFrom")
            );

            CREATE UNIQUE INDEX "IX_StudentLogbooks_SerialNumber" ON "StudentLogbooks" ("SerialNumber");
            CREATE INDEX "IX_LogbookRequirements_CurriculumId" ON "LogbookRequirements" ("CurriculumId");
            CREATE INDEX "IX_LogbookCompetencyRequirements_LogbookRequirementId" ON "LogbookCompetencyRequirements" ("LogbookRequirementId");
            CREATE INDEX "IX_StudentLogbooks_StudentId_LogbookRequirementId" ON "StudentLogbooks" ("StudentId", "LogbookRequirementId");
            CREATE INDEX "IX_StudentLogbookCompetencies_StudentLogbookId" ON "StudentLogbookCompetencies" ("StudentLogbookId");
            CREATE INDEX "IX_StudentLogbookCompetencies_CompetencyRequirementId" ON "StudentLogbookCompetencies" ("CompetencyRequirementId");
            CREATE INDEX "IX_StudentLogbookCompetencies_StudentPlacementId" ON "StudentLogbookCompetencies" ("StudentPlacementId");
            CREATE INDEX "IX_UhpabFeeReferences_Category_ProgrammeCode_IsActive" ON "UhpabFeeReferences" ("Category", "ProgrammeCode", "IsActive");
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TABLE IF EXISTS "StudentLogbookCompetencies";
            DROP TABLE IF EXISTS "StudentLogbooks";
            DROP TABLE IF EXISTS "LogbookCompetencyRequirements";
            DROP TABLE IF EXISTS "UhpabFeeReferences";
            DROP TABLE IF EXISTS "LogbookRequirements";
            """);
    }
}
