using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Text;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261123100000_ImportKshsMasterCurriculumCatalogue")]
public partial class ImportKshsMasterCurriculumCatalogue : Migration
{
    private const string CompressedSourceRows = """
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
""";

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            INSERT INTO "Programmes"
            ("Id","DepartmentId","Code","Name","Award","AwardTitle","DurationYears","DurationUnit",
             "StudyMode","DeliveryType","Type","Regulator","ApprovalReference","ApprovalDate",
             "ApprovalStatus","SourceReference","IsReferenceOnly","IsActive")
            VALUES
            (gen_random_uuid(),NULL,'KSHS-CFSN','Certificate in Food Science and Nutrition','Certificate',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-DFSN','Diploma in Food Science and Nutrition','Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'SB-DHND','Diploma in Human Nutrition and Dietetics','Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-DHND','Diploma in Human Nutrition and Dietetics','Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-DDS','Diploma in Diagnostic Sonography','Diploma',NULL,3,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'SB-ADDS','Advanced Diploma in Diagnostic Sonography','Advanced Diploma',NULL,1,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-ADDS','Advanced Diploma in Diagnostic Sonography','Advanced Diploma',NULL,1,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-CBME','Certificate in Biomedical Engineering','Certificate',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-DBME','Diploma in Biomedical Engineering','Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'DSSOM','Diploma in Secretarial Studies and Office Management','Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-CSSOM','Certificate in Secretarial Studies and Office Management','Certificate',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-ADHPE','Advanced Diploma in Health Promotion and Education','Advanced Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE),
            (gen_random_uuid(),NULL,'KSHS-DFST','Diploma in Food Science and Technology','Diploma',NULL,2,'Years','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum & Course Units Catalog supplied by the institution',FALSE,TRUE)
            ON CONFLICT ("Code") DO UPDATE SET
                "Name"=EXCLUDED."Name",
                "Award"=EXCLUDED."Award",
                "DurationYears"=EXCLUDED."DurationYears",
                "DurationUnit"=EXCLUDED."DurationUnit",
                "Regulator"=EXCLUDED."Regulator",
                "IsReferenceOnly"=FALSE,
                "IsActive"=TRUE,
                "ApprovalStatus"='Institutional',
                "SourceReference"=EXCLUDED."SourceReference";

            UPDATE "Programmes"
            SET "IsActive"=TRUE, "IsReferenceOnly"=FALSE
            WHERE "Code" IN (
                'CN','CM','DN','DM','DCM','CPH','PHA','CLT','MLT','CMR','MER',
                'SB-CPH','SB-DPH','KSHS-CFSN','KSHS-DFSN','SB-DHND','KSHS-DHND',
                'KSHS-DDS','SB-ADDS','KSHS-ADDS','KSHS-CBME','KSHS-DBME',
                'SB-CGC','SB-CRM-C','SB-DHCG','SB-DRM','DSSOM','KSHS-ADHPE','SB-BRIDGE','KSHS-DFST',
                'CMHN','CEC','CEH','CTA','DMHN','DMHND'
            );

            -- The source provides all six semesters for the DMHN / DMHND track.
            UPDATE "Programmes"
            SET "DurationYears"=3, "DurationUnit"='Years'
            WHERE "Code" IN ('DMHN','DMHND');
            """);

        migrationBuilder.Sql(BuildCurriculumImportSql());
    }

    private static string BuildCurriculumImportSql()
    {
        using var compressed = new MemoryStream(Convert.FromBase64String(CompressedSourceRows));
        using var gzip = new GZipStream(compressed, CompressionMode.Decompress);
        using var reader = new StreamReader(gzip, Encoding.UTF8);
        var values = new List<string>();
        string line;
        while ((line = reader.ReadLine()) is not null)
        {
            var fields = line.Split('\t');
            if (fields.Length != 7)
                throw new InvalidOperationException("The embedded KSHS curriculum import row is malformed.");

            values.Add($"({SqlLiteral(fields[0])},{int.Parse(fields[1], CultureInfo.InvariantCulture)},{int.Parse(fields[2], CultureInfo.InvariantCulture)},{SqlLiteral(fields[3])},{SqlLiteral(fields[4])},{int.Parse(fields[5], CultureInfo.InvariantCulture)},{SqlLiteral(fields[6])})");
        }

        if (values.Count != 496)
            throw new InvalidOperationException($"Expected 496 programme-course mappings but found {values.Count}.");

        var sourceRows = $"""
            WITH source_rows("ProgrammeCode","YearOfStudy","SemesterNumber","Code","Name","CreditUnits","Assessment")
            AS (VALUES
            {string.Join("," + Environment.NewLine, values)}
            )
            """;

        return $"""
            {sourceRows}
            UPDATE "Courses" c
            SET "CreditUnits"=s."CreditUnits",
                "Description"='Imported from KSHS Master Curriculum & Course Units Catalog. Assessment: ' || s."Assessment",
                "CourseType"=s."Assessment",
                "IsActive"=TRUE,
                "IsDeleted"=FALSE
            FROM (
                SELECT DISTINCT p."Regulator" AS "AuthorityCode",r."Code",r."Name",r."CreditUnits",r."Assessment"
                FROM source_rows r
                INNER JOIN "Programmes" p ON p."Code"=r."ProgrammeCode"
            ) s
            WHERE c."AuthorityCode"=s."AuthorityCode"
              AND c."Code"=s."Code"
              AND c."Name"=s."Name";

            {sourceRows}
            INSERT INTO "Courses"
            ("Id","AuthorityCode","Code","Name","CreditUnits","Description","CourseType","IsActive","IsDeleted")
            SELECT gen_random_uuid(),s."AuthorityCode",s."Code",s."Name",s."CreditUnits",
                   'Imported from KSHS Master Curriculum & Course Units Catalog. Assessment: ' || s."Assessment",
                   s."Assessment",TRUE,FALSE
            FROM (
                SELECT DISTINCT p."Regulator" AS "AuthorityCode",r."Code",r."Name",r."CreditUnits",r."Assessment"
                FROM source_rows r
                INNER JOIN "Programmes" p ON p."Code"=r."ProgrammeCode"
            ) s
            WHERE NOT EXISTS (
                SELECT 1 FROM "Courses" c
                WHERE c."AuthorityCode"=s."AuthorityCode"
                  AND c."Code"=s."Code"
                  AND c."Name"=s."Name"
                  AND c."IsActive"=TRUE
                  AND c."IsDeleted"=FALSE
            );

            {sourceRows}
            INSERT INTO "Curricula"
            ("Id","ProgrammeId","Version","Title","MinimumCredits","EffectiveFrom","EffectiveTo",
             "ProgrammeType","Status","IsActive","IsDeleted")
            SELECT gen_random_uuid(),p."Id",'KSHS-MASTER-CATALOG-2026-11',
                   'KSHS Master Curriculum & Course Units Catalog — imported source version',
                   0,DATE '2026-11-23',NULL,0,'Draft',TRUE,FALSE
            FROM "Programmes" p
            INNER JOIN (SELECT DISTINCT "ProgrammeCode" FROM source_rows) s
                ON s."ProgrammeCode"=p."Code"
            WHERE NOT EXISTS (
                SELECT 1 FROM "Curricula" cu
                WHERE cu."ProgrammeId"=p."Id"
                  AND cu."Version"='KSHS-MASTER-CATALOG-2026-11'
            );

            {sourceRows}
            INSERT INTO "CurriculumCourses"
            ("Id","CurriculumId","CourseId","YearOfStudy","SemesterNumber","IsCore","IsDeleted")
            SELECT gen_random_uuid(),cu."Id",course."Id",s."YearOfStudy",s."SemesterNumber",TRUE,FALSE
            FROM source_rows s
            INNER JOIN "Programmes" p ON p."Code"=s."ProgrammeCode"
            INNER JOIN "Curricula" cu
                ON cu."ProgrammeId"=p."Id"
               AND cu."Version"='KSHS-MASTER-CATALOG-2026-11'
            JOIN LATERAL (
                SELECT c."Id"
                FROM "Courses" c
                WHERE c."AuthorityCode"=p."Regulator"
                  AND c."Code"=s."Code"
                  AND c."Name"=s."Name"
                  AND c."IsActive"=TRUE
                  AND c."IsDeleted"=FALSE
                ORDER BY c."Id"
                LIMIT 1
            ) course ON TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM "CurriculumCourses" existing
                WHERE existing."CurriculumId"=cu."Id"
                  AND existing."CourseId"=course."Id"
                  AND existing."YearOfStudy"=s."YearOfStudy"
                  AND existing."SemesterNumber"=s."SemesterNumber"
                  AND existing."IsDeleted"=FALSE
            );

            -- Four individually specified units were printed outside the regular
            -- semester-label pattern in the source. Import them explicitly:
            -- DHND 2202/2203 (shared by three aliases) and DMHN 3101/3201.
            WITH extra_rows("ProgrammeCode","YearOfStudy","SemesterNumber","Code","Name","CreditUnits","Assessment") AS (VALUES
                ('SB-DHND',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('KSHS-DHND',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('KSHS-DFSN',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('SB-DHND',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('KSHS-DHND',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('KSHS-DFSN',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('DMHN',3,1,'DMHN 3101','Child/Adolescent, Geriatric, Forensic Psychiatry & Research Methods',6,'Theory'),
                ('DMHN',3,2,'DMHN 3201','Mental Health Leadership, Dissertation & Senior Practicum III',8,'Clinical Final')
            )
            UPDATE "Courses" c
            SET "CreditUnits"=s."CreditUnits",
                "Description"='Imported from KSHS Master Curriculum & Course Units Catalog. Assessment: ' || s."Assessment",
                "CourseType"=s."Assessment",
                "IsActive"=TRUE,
                "IsDeleted"=FALSE
            FROM (
                SELECT DISTINCT p."Regulator" AS "AuthorityCode",r."Code",r."Name",r."CreditUnits",r."Assessment"
                FROM extra_rows r
                INNER JOIN "Programmes" p ON p."Code"=r."ProgrammeCode"
            ) s
            WHERE c."AuthorityCode"=s."AuthorityCode"
              AND c."Code"=s."Code"
              AND c."Name"=s."Name";

            WITH extra_rows("ProgrammeCode","YearOfStudy","SemesterNumber","Code","Name","CreditUnits","Assessment") AS (VALUES
                ('SB-DHND',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('KSHS-DHND',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('KSHS-DFSN',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('SB-DHND',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('KSHS-DHND',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('KSHS-DFSN',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('DMHN',3,1,'DMHN 3101','Child/Adolescent, Geriatric, Forensic Psychiatry & Research Methods',6,'Theory'),
                ('DMHN',3,2,'DMHN 3201','Mental Health Leadership, Dissertation & Senior Practicum III',8,'Clinical Final')
            )
            INSERT INTO "Courses"
            ("Id","AuthorityCode","Code","Name","CreditUnits","Description","CourseType","IsActive","IsDeleted")
            SELECT gen_random_uuid(),s."AuthorityCode",s."Code",s."Name",s."CreditUnits",
                   'Imported from KSHS Master Curriculum & Course Units Catalog. Assessment: ' || s."Assessment",
                   s."Assessment",TRUE,FALSE
            FROM (
                SELECT DISTINCT p."Regulator" AS "AuthorityCode",r."Code",r."Name",r."CreditUnits",r."Assessment"
                FROM extra_rows r
                INNER JOIN "Programmes" p ON p."Code"=r."ProgrammeCode"
            ) s
            WHERE NOT EXISTS (
                SELECT 1 FROM "Courses" c
                WHERE c."AuthorityCode"=s."AuthorityCode"
                  AND c."Code"=s."Code"
                  AND c."Name"=s."Name"
                  AND c."IsActive"=TRUE
                  AND c."IsDeleted"=FALSE
            );

            WITH extra_rows("ProgrammeCode","YearOfStudy","SemesterNumber","Code","Name","CreditUnits","Assessment") AS (VALUES
                ('SB-DHND',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('KSHS-DHND',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('KSHS-DFSN',2,2,'DHND 2202','Nutrition Programme Planning, M&E & Entrepreneurship',4,'Theory'),
                ('SB-DHND',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('KSHS-DHND',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('KSHS-DFSN',2,2,'DHND 2203','Nutrition & Dietetics Research Dissertation',4,'Project'),
                ('DMHN',3,1,'DMHN 3101','Child/Adolescent, Geriatric, Forensic Psychiatry & Research Methods',6,'Theory'),
                ('DMHN',3,2,'DMHN 3201','Mental Health Leadership, Dissertation & Senior Practicum III',8,'Clinical Final')
            )
            INSERT INTO "CurriculumCourses"
            ("Id","CurriculumId","CourseId","YearOfStudy","SemesterNumber","IsCore","IsDeleted")
            SELECT gen_random_uuid(),cu."Id",course."Id",s."YearOfStudy",s."SemesterNumber",TRUE,FALSE
            FROM extra_rows s
            INNER JOIN "Programmes" p ON p."Code"=s."ProgrammeCode"
            INNER JOIN "Curricula" cu
                ON cu."ProgrammeId"=p."Id"
               AND cu."Version"='KSHS-MASTER-CATALOG-2026-11'
            JOIN LATERAL (
                SELECT c."Id"
                FROM "Courses" c
                WHERE c."AuthorityCode"=p."Regulator"
                  AND c."Code"=s."Code"
                  AND c."Name"=s."Name"
                  AND c."IsActive"=TRUE
                  AND c."IsDeleted"=FALSE
                ORDER BY c."Id"
                LIMIT 1
            ) course ON TRUE
            WHERE NOT EXISTS (
                SELECT 1 FROM "CurriculumCourses" existing
                WHERE existing."CurriculumId"=cu."Id"
                  AND existing."CourseId"=course."Id"
                  AND existing."YearOfStudy"=s."YearOfStudy"
                  AND existing."SemesterNumber"=s."SemesterNumber"
                  AND existing."IsDeleted"=FALSE
            );

            -- The source uses the first two digits of each four-digit unit code
            -- for year/semester placement. Normalize those positions here so labels
            -- such as "CMR Yr 2 Sem 1" are not reduced to Year 1 by fallback parsing.
            -- ADDS uses 41xx/42xx codes for its one-year advanced award, so its
            -- explicit one-year semester placement is retained as Year 1 Semesters 1–2.
            UPDATE "CurriculumCourses" cc
            SET "YearOfStudy"=substring(split_part(course."Code",' ',2) from 1 for 1)::integer,
                "SemesterNumber"=substring(split_part(course."Code",' ',2) from 2 for 1)::integer
            FROM "Curricula" cu, "Programmes" p, "Courses" course
            WHERE cc."CurriculumId"=cu."Id"
              AND p."Id"=cu."ProgrammeId"
              AND course."Id"=cc."CourseId"
              AND cu."Version"='KSHS-MASTER-CATALOG-2026-11'
              AND p."Code" NOT IN ('SB-ADDS','KSHS-ADDS')
              AND split_part(course."Code",' ',2) ~ '^[1-3][12][0-9][0-9]';
            -- The source groups these certificate/diploma pairs under shared semester
            -- rows. Copy the exact course mappings to each named programme alias.
            WITH curriculum_aliases("SourceCode","TargetCode") AS (VALUES
                ('DSSOM','KSHS-CSSOM'),
                ('SB-DHCG','SB-CGC'),
                ('SB-DRM','SB-CRM-C'),
                ('DMHN','DMHND')
            )
            INSERT INTO "Curricula"
            ("Id","ProgrammeId","Version","Title","MinimumCredits","EffectiveFrom","EffectiveTo",
             "ProgrammeType","Status","IsActive","IsDeleted")
            SELECT gen_random_uuid(),targetProgramme."Id",'KSHS-MASTER-CATALOG-2026-11',
                   'KSHS Master Curriculum & Course Units Catalog — imported source version',
                   0,DATE '2026-11-23',NULL,0,'Draft',TRUE,FALSE
            FROM curriculum_aliases alias
            INNER JOIN "Programmes" targetProgramme ON targetProgramme."Code"=alias."TargetCode"
            WHERE NOT EXISTS (
                SELECT 1 FROM "Curricula" existing
                WHERE existing."ProgrammeId"=targetProgramme."Id"
                  AND existing."Version"='KSHS-MASTER-CATALOG-2026-11'
            );

            WITH curriculum_aliases("SourceCode","TargetCode") AS (VALUES
                ('DSSOM','KSHS-CSSOM'),
                ('SB-DHCG','SB-CGC'),
                ('SB-DRM','SB-CRM-C'),
                ('DMHN','DMHND')
            )
            INSERT INTO "CurriculumCourses"
            ("Id","CurriculumId","CourseId","YearOfStudy","SemesterNumber","IsCore","IsDeleted")
            SELECT gen_random_uuid(),targetCurriculum."Id",sourceMapping."CourseId",
                   sourceMapping."YearOfStudy",sourceMapping."SemesterNumber",TRUE,FALSE
            FROM curriculum_aliases alias
            INNER JOIN "Programmes" sourceProgramme ON sourceProgramme."Code"=alias."SourceCode"
            INNER JOIN "Curricula" sourceCurriculum
                ON sourceCurriculum."ProgrammeId"=sourceProgramme."Id"
               AND sourceCurriculum."Version"='KSHS-MASTER-CATALOG-2026-11'
            INNER JOIN "CurriculumCourses" sourceMapping
                ON sourceMapping."CurriculumId"=sourceCurriculum."Id"
               AND sourceMapping."IsDeleted"=FALSE
            INNER JOIN "Programmes" targetProgramme ON targetProgramme."Code"=alias."TargetCode"
            INNER JOIN "Curricula" targetCurriculum
                ON targetCurriculum."ProgrammeId"=targetProgramme."Id"
               AND targetCurriculum."Version"='KSHS-MASTER-CATALOG-2026-11'
            WHERE NOT EXISTS (
                SELECT 1 FROM "CurriculumCourses" existing
                WHERE existing."CurriculumId"=targetCurriculum."Id"
                  AND existing."CourseId"=sourceMapping."CourseId"
                  AND existing."YearOfStudy"=sourceMapping."YearOfStudy"
                  AND existing."SemesterNumber"=sourceMapping."SemesterNumber"
                  AND existing."IsDeleted"=FALSE
            );

            -- The source explicitly labels CEH 1202 as shared by CEC and CEH.
            INSERT INTO "CurriculumCourses"
            ("Id","CurriculumId","CourseId","YearOfStudy","SemesterNumber","IsCore","IsDeleted")
            SELECT gen_random_uuid(),targetCurriculum."Id",sourceMapping."CourseId",
                   sourceMapping."YearOfStudy",sourceMapping."SemesterNumber",TRUE,FALSE
            FROM "Programmes" sourceProgramme
            INNER JOIN "Curricula" sourceCurriculum
                ON sourceCurriculum."ProgrammeId"=sourceProgramme."Id"
               AND sourceCurriculum."Version"='KSHS-MASTER-CATALOG-2026-11'
            INNER JOIN "CurriculumCourses" sourceMapping
                ON sourceMapping."CurriculumId"=sourceCurriculum."Id"
               AND sourceMapping."IsDeleted"=FALSE
            INNER JOIN "Courses" sharedCourse
                ON sharedCourse."Id"=sourceMapping."CourseId"
               AND sharedCourse."Code"='CEH 1202'
            INNER JOIN "Programmes" targetProgramme ON targetProgramme."Code"='CEC'
            INNER JOIN "Curricula" targetCurriculum
                ON targetCurriculum."ProgrammeId"=targetProgramme."Id"
               AND targetCurriculum."Version"='KSHS-MASTER-CATALOG-2026-11'
            WHERE sourceProgramme."Code"='CEH'
              AND NOT EXISTS (
                  SELECT 1 FROM "CurriculumCourses" existing
                  WHERE existing."CurriculumId"=targetCurriculum."Id"
                    AND existing."CourseId"=sourceMapping."CourseId"
                    AND existing."YearOfStudy"=sourceMapping."YearOfStudy"
                    AND existing."SemesterNumber"=sourceMapping."SemesterNumber"
                    AND existing."IsDeleted"=FALSE
              );

            UPDATE "Curricula" cu
            SET "MinimumCredits"=COALESCE((
                SELECT SUM(c."CreditUnits")
                FROM "CurriculumCourses" cc
                INNER JOIN "Courses" c ON c."Id"=cc."CourseId"
                WHERE cc."CurriculumId"=cu."Id"
                  AND cc."IsDeleted"=FALSE
                  AND c."IsDeleted"=FALSE
            ),0)
            WHERE cu."Version"='KSHS-MASTER-CATALOG-2026-11';

            UPDATE "Curricula" cu
            SET "IsActive"=FALSE
            FROM "Programmes" p
            WHERE cu."ProgrammeId"=p."Id"
              AND cu."Version"='UHPAB-DEC-2025-PROVISIONAL'
              AND p."Code" IN (
                'CN','CM','DN','DM','DCM','CPH','PHA','CLT','MLT','CMR','MER',
                'CMHN','CEC','CEH','CTA','DMHN','DMHND'
              );
            """;
    }

    private static string SqlLiteral(string value) => "'" + value.Replace("'", "''") + "'";

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Imported academic catalogue records are intentionally retained on rollback.
        // They may already be referenced by curriculum, timetable, registration or student records.
    }
}
