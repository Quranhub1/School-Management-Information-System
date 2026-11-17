using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261117140000_CompleteKshsSchoolBasedProgrammeCatalogue")]
public partial class CompleteKshsSchoolBasedProgrammeCatalogue : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- KSHS publishes this programme list as its 2024/2025 institutional offering.
-- Durations are transcribed from that page. Half-year duration is represented
-- as five semesters because Programme.DurationYears is an integer field.
UPDATE ""Programmes""
SET ""DurationYears"" = CASE
        WHEN ""Code"" IN ('SB-CPH','SB-CRM-C','SB-CGC','SB-DPH','SB-DRM','SB-DHCG') THEN 2
        WHEN ""Code"" = 'SB-BRIDGE' THEN 9
        ELSE ""DurationYears"" END,
    ""DurationUnit"" = CASE
        WHEN ""Code"" = 'SB-BRIDGE' THEN 'Months'
        ELSE 'Years' END,
    ""Regulator"" = 'SCHOOL_BASED',
    ""ApprovalStatus"" = 'Institutional',
    ""SourceReference"" = 'Kampala School of Health Sciences programmes (2024/2025): https://www.kshs.ac.ug/programs/',
    ""IsReferenceOnly"" = FALSE,
    ""IsActive"" = TRUE
WHERE ""Code"" IN ('SB-CPH','SB-CRM-C','SB-CGC','SB-DPH','SB-DRM','SB-DHCG','SB-BRIDGE');

-- Keep the KSHS institutional catalogue distinct from UHPAB/UVTAB records,
-- even where programme names overlap. This records what KSHS itself lists.
WITH kshs(""Code"",""Name"",""Award"",""DurationYears"",""DurationUnit"",""Type"") AS (
    VALUES
    ('KSHS-CEN','Certificate in Enrolled Nursing','Certificate',5,'Semesters (2.5 years)',0),
    ('KSHS-CEM','Certificate in Enrolled Midwifery','Certificate',5,'Semesters (2.5 years)',0),
    ('KSHS-CPH','Certificate in Pharmacy','Certificate',2,'Years',0),
    ('KSHS-CMLT','Certificate in Medical Laboratory Techniques','Certificate',2,'Years',0),
    ('KSHS-CMRHI','Certificate in Medical Records and Health Informatics','Certificate',2,'Years',0),
    ('KSHS-CFSN','Certificate in Food Science and Nutrition','Certificate',2,'Years',0),
    ('KSHS-CBME','Certificate in Biomedical Engineering','Certificate',2,'Years',0),
    ('KSHS-CSSOM','Certificate in Secretarial Studies and Office Management','Certificate',2,'Years',0),
    ('KSHS-DCMCH','Diploma in Clinical Medicine and Community Health','Diploma',3,'Years',0),
    ('KSHS-DPH','Diploma in Pharmacy','Diploma',3,'Years',0),
    ('KSHS-DDS','Diploma in Diagnostic Sonography','Diploma',3,'Years',0),
    ('KSHS-DBME','Diploma in Biomedical Engineering','Diploma',2,'Years',0),
    ('KSHS-DSSOM','Diploma in Secretarial Studies and Office Management','Diploma',2,'Years',0),
    ('KSHS-DMRHI','Diploma in Medical Records and Health Informatics','Diploma',3,'Years',0),
    ('KSHS-DFSN','Diploma in Food Science and Nutrition','Diploma',2,'Years',0),
    ('KSHS-DFST','Diploma in Food Science and Technology','Diploma',2,'Years',1),
    ('KSHS-DHND','Diploma in Human Nutrition and Dietetics','Diploma',2,'Years',1),
    ('KSHS-ADDS','Advanced Diploma in Diagnostic Sonography','Advanced Diploma',1,'Years',1),
    ('KSHS-ADHPE','Advanced Diploma in Health Promotion and Education','Advanced Diploma',2,'Years',1)
)
INSERT INTO ""Programmes""
(""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
SELECT gen_random_uuid(),NULL,k.""Code"",k.""Name"",k.""Award"",NULL,k.""DurationYears"",k.""DurationUnit"",
       'Full-time','Academic',k.""Type"",'SCHOOL_BASED',NULL,NULL,'Institutional',
       'Kampala School of Health Sciences programmes (2024/2025): https://www.kshs.ac.ug/programs/',
       FALSE,TRUE
FROM kshs k
WHERE NOT EXISTS (SELECT 1 FROM ""Programmes"" p WHERE upper(p.""Code"")=upper(k.""Code""));

-- The public KSHS page supplies programme names and durations only. It does
-- not publish year/semester course-unit matrices; no course mappings are
-- fabricated here. Those must be entered from the school's approved curricula.
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Catalogue records are retained on rollback to protect curriculum,
        // admissions and student references created after this migration.
    }
}
