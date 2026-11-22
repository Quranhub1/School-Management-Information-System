using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261122110000_SeedCurriculumProgrammesFromCatalog")]
public partial class SeedCurriculumProgrammesFromCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- ============================================================================
-- Programme Registry seeded from KSHS Master Curriculum & Course Units Catalog
-- (26-page PDF curriculum catalog, extracted and integrated 2026-11-22)
-- ============================================================================

-- UHPAB programmes with corrected durations per the catalog
UPDATE ""Programmes""
SET ""DurationYears"" = 2, ""DurationUnit"" = 'Semesters (2.5 years)', ""ApprovalStatus"" = 'ListedForReview',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (UHPAB-aligned)'
WHERE ""Regulator"" = 'UHPAB' AND ""Code"" IN ('CM', 'CN');

UPDATE ""Programmes""
SET ""DurationYears"" = 4, ""DurationUnit"" = 'Semesters (2 years)', ""ApprovalStatus"" = 'ListedForReview',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (UHPAB-aligned)'
WHERE ""Regulator"" = 'UHPAB' AND ""Code"" IN ('CEC', 'CEH', 'CLT', 'CMR', 'CTA', 'CPH', 'CMHN');

UPDATE ""Programmes""
SET ""DurationYears"" = 3, ""DurationUnit"" = 'Years', ""ApprovalStatus"" = 'ListedForReview',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (UHPAB-aligned)'
WHERE ""Regulator"" = 'UHPAB' AND ""Code"" IN ('DN', 'DM', 'DCM', 'PHA', 'MLT', 'MER', 'DMHN', 'DCO', 'DCP', 'ORD', 'OPM', 'DDT', 'PHD', 'DMR', 'DOT', 'OTD', 'DPT', 'DEH', 'DHP', 'DCN', 'ENTO');

-- Insert UHPAB programmes missing from earlier seeds
INSERT INTO ""Programmes"" (""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
VALUES
-- UHPAB Higher Diplomas (2 Semesters each)
(gen_random_uuid(),NULL,'HCO','Higher Diploma in Clinical Ophthalmology','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DOR','Higher Diploma in Ear, Nose and Throat Surgery','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DAN','Higher Diploma in Anaesthesia','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DEC','Higher Diploma in Emergency Care','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'HDP','Higher Diploma in Clinical Psychiatry','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DLM','Higher Diploma in Health Leadership and Management','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'HPE','Higher Diploma in Health Promotion and Education','Higher Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Higher Diploma)',FALSE,TRUE),
-- UHPAB Advanced Diplomas (2 Semesters each)
(gen_random_uuid(),NULL,'ADPHN','Advanced Diploma in Public Health Nursing','Advanced Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Advanced Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'ADCCN','Advanced Diploma in Critical Care Nursing','Advanced Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Advanced Diploma)',FALSE,TRUE),
(gen_random_uuid(),NULL,'ADPCN','Advanced Diploma in Palliative Care Nursing','Advanced Diploma',NULL,2,'Semesters','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Advanced Diploma)',FALSE,TRUE),
-- UHPAB Extension / Legacy programmes
(gen_random_uuid(),NULL,'DMHNE','Diploma in Mental Health Nursing Extension','Diploma',NULL,3,'Years','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Extension Track)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DNE','Diploma in Nursing Extension','Diploma',NULL,3,'Years','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Extension Track)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DME','Diploma in Midwifery Extension','Diploma',NULL,3,'Years','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Extension Track)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DMEL','Diploma in Midwifery Extension (E-Learning)','Diploma',NULL,3,'Years','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','KSHS Master Curriculum Catalog (UHPAB Extension Track)',FALSE,TRUE)
ON CONFLICT (""Code"") DO NOTHING;

-- SCHOOL_BASED programmes with corrected durations per the catalog
UPDATE ""Programmes""
SET ""DurationYears"" = 2, ""DurationUnit"" = 'Years', ""ApprovalStatus"" = 'Institutional',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (SCHOOL_BASED)'
WHERE ""Regulator"" = 'SCHOOL_BASED' AND ""Code"" IN ('SB-CPH','SB-DPH','SB-CGC','SB-DHCG','SB-CRM-C','SB-DRM','SB-DHND','KSHS-CFSN','KSHS-DFSN','KSHS-CBME','KSHS-DBME','KSHS-CSSOM','KSHS-DSSOM');

UPDATE ""Programmes""
SET ""DurationYears"" = 3, ""DurationUnit"" = 'Years', ""ApprovalStatus"" = 'Institutional',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (SCHOOL_BASED)'
WHERE ""Regulator"" = 'SCHOOL_BASED' AND ""Code"" IN ('KSHS-DDS');

UPDATE ""Programmes""
SET ""DurationYears"" = 1, ""DurationUnit"" = 'Years', ""ApprovalStatus"" = 'Institutional',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (SCHOOL_BASED)'
WHERE ""Regulator"" = 'SCHOOL_BASED' AND ""Code"" IN ('SB-ADDS');

UPDATE ""Programmes""
SET ""DurationYears"" = 9, ""DurationUnit"" = 'Months', ""ApprovalStatus"" = 'Institutional',
    ""SourceReference"" = 'KSHS Master Curriculum & Course Units Catalog (SCHOOL_BASED)'
WHERE ""Regulator"" = 'SCHOOL_BASED' AND ""Code"" IN ('SB-BRIDGE');

-- Insert SCHOOL_BASED programmes missing from earlier seeds
INSERT INTO ""Programmes"" (""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
VALUES
-- KSHS CEN / CEM coded under SCHOOL_BASED (mapped to UHPAB CN / CM curricula)
(gen_random_uuid(),NULL,'KSHS-CEN','Certificate in Enrolled Nursing','Certificate',NULL,5,'Semesters (2.5 years)','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum Catalog (SCHOOL_BASED; maps to UHPAB CN)',FALSE,TRUE),
(gen_random_uuid(),NULL,'KSHS-CEM','Certificate in Enrolled Midwifery','Certificate',NULL,5,'Semesters (2.5 years)','Full-time','Academic',0,'SCHOOL_BASED',NULL,NULL,'Institutional','KSHS Master Curriculum Catalog (SCHOOL_BASED; maps to UHPAB CM)',FALSE,TRUE)
ON CONFLICT (""Code"") DO NOTHING;

-- UVTAB Active programmes (CBET, modular, reference active)
INSERT INTO ""Programmes"" (""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
VALUES
(gen_random_uuid(),NULL,'UVTAB-DCEN','Diploma in Nursing','Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DCOS','Diploma in Cosmetology','Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DHN','Diploma in Human Nutrition','Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DRIM','Diploma in Records and Information Management','Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDWE','National Diploma in Water Engineering','National Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDM','National Diploma in Mechanical Engineering','National Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDA','National Diploma in Automotive','National Diploma',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCCW','National Craft Certificate in Welding','National Craft Certificate',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCCBAM','National Craft Certificate in Business Administration and Management','National Craft Certificate',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCCMM','National Craft Certificate in Metal Machining','National Craft Certificate',NULL,4,'Semesters','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'NeedsVerification','UVTAB active CBET programme (KSHS Master Curriculum Catalog)',FALSE,TRUE)
ON CONFLICT (""Code"") DO NOTHING;
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Retain catalogue records on rollback; deleting them could invalidate curriculum references.
    }
}
