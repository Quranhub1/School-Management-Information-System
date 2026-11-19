using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261117150000_ImportUvtabProgrammeCatalogue")]
public partial class ImportUvtabProgrammeCatalogue : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- Imported programme titles/codes from UVTAB's official assessor application
-- catalogue. This is a programme register, not a curriculum or semester map.
-- The public UVTAB curriculum portal currently publishes no downloadable
-- approved curriculum records. Therefore duration and course mappings are
-- deliberately left unspecified and records require institutional verification.
WITH source_programmes(""Code"",""Name"",""Award"",""Type"") AS (
    VALUES
    ('UVTAB-DACF','Diploma in Accounting and Finance','Diploma',0),
    ('UVTAB-DABM','Diploma in Agribusiness Management','Diploma',0),
    ('UVTAB-DBE','Diploma in Biomedical Engineering','Diploma',0),
    ('UVTAB-DBA','Diploma in Business Administration','Diploma',0),
    ('UVTAB-DCEN','Diploma in Computer Engineering','Diploma',0),
    ('UVTAB-DCOS','Diploma in Computer Science','Diploma',0),
    ('UVTAB-DCIS','Diploma in Computing and Information Systems','Diploma',0),
    ('UVTAB-DFSN','Diploma in Food Science and Nutrition','Diploma',0),
    ('UVTAB-DHIC','Diploma in Hotel and Institutional Catering','Diploma',0),
    ('UVTAB-DHN','Diploma in Human Nutrition and Dietetics','Diploma',0),
    ('UVTAB-DHRM','Diploma in Human Resources Management','Diploma',0),
    ('UVTAB-DPLM','Diploma in Procurement and Logistics Management','Diploma',0),
    ('UVTAB-DRIM','Diploma in Records and Information Management','Diploma',0),
    ('UVTAB-DSIM','Diploma in Secretarial Studies and Information Management','Diploma',0),
    ('UVTAB-DTM','Diploma in Tourism Management','Diploma',0),
    ('UVTAB-NCBE','National Certificate in Biomedical Engineering','National Certificate',0),
    ('UVTAB-NCBC','National Certificate in Building Construction','National Certificate',0),
    ('UVTAB-NCBA','National Certificate in Business Administration','National Certificate',0),
    ('UVTAB-NCES','National Certificate in Electrical Installation Systems and Maintenance','National Certificate',0),
    ('UVTAB-NCICT','National Certificate in Information and Communication Technology','National Certificate',0),
    ('UVTAB-NCRM','National Certificate in Records and Information Management','National Certificate',0),
    ('UVTAB-NCWF','National Certificate in Welding and Fabrication','National Certificate',0),
    ('UVTAB-NDCE','National Diploma in Civil Engineering','National Diploma',0),
    ('UVTAB-NDEE','National Diploma in Electrical Engineering','National Diploma',0),
    ('UVTAB-NDME','National Diploma in Mechanical Engineering','National Diploma',0),
    ('UVTAB-NDICT','National Diploma in Information and Communication Technology','National Diploma',0),
    ('UVTAB-NDTM','National Diploma in Tourism Management','National Diploma',0),
    ('UVTAB-NDWE','National Diploma in Water Engineering','National Diploma',0),
    ('UVTAB-NDM','National Diploma in Marketing','National Diploma',0),
    ('UVTAB-NDA','National Diploma in Accountancy','National Diploma',0),
    ('UVTAB-NCCW','National Craft Certificate in Welding','National Craft Certificate',0),
    ('UVTAB-NCCBAM','National Craft Certificate in Business Administration and Management','National Craft Certificate',0),
    ('UVTAB-NCCMM','National Craft Certificate in Marketing Management','National Craft Certificate',0)
)
INSERT INTO ""Programmes""
(""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
SELECT gen_random_uuid(),NULL,s.""Code"",s.""Name"",s.""Award"",NULL,0,'Not published',
       'Full-time','CompetencyBased',s.""Type"",'UVTAB',NULL,NULL,'NeedsVerification',
       'UVTAB official assessor programme catalogue: https://assess.uvtab.go.ug/org/apply/; programme titles only. Verify programme approval, award level, duration and current curriculum with UVTAB before delivery.',
       FALSE,TRUE
FROM source_programmes s
WHERE NOT EXISTS (SELECT 1 FROM ""Programmes"" p WHERE upper(p.""Code"")=upper(s.""Code""));
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep catalogue entries on rollback so any later curriculum/student
        // references are not removed. Imported records remain marked NeedsVerification.
    }
}
