using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261117100000_RefreshUhpabUvtabProgrammeCatalogues")]
public partial class RefreshUhpabUvtabProgrammeCatalogues : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // UHPAB's published programme page explicitly provides the certificate durations
        // and semester counts. The database stores programme duration; semester counts are
        // also recorded in SourceReference so they are not confused with live academic periods.
        migrationBuilder.Sql(@"
UPDATE ""Programmes"" SET ""DurationYears"" = 5, ""DurationUnit"" = 'Semesters (2.5 years)',
 ""ApprovalStatus"" = 'ListedForReview',
 ""SourceReference"" = 'UHPAB Programs & Fees: https://uhpab.go.ug/programs/ — 2.5 years, 5 semesters'
WHERE ""Regulator"" = 'UHPAB' AND ""Code"" IN ('CM','CN','CMHN');

UPDATE ""Programmes"" SET ""DurationYears"" = 4, ""DurationUnit"" = 'Semesters (2 years)',
 ""ApprovalStatus"" = 'ListedForReview',
 ""SourceReference"" = 'UHPAB Programs & Fees: https://uhpab.go.ug/programs/ — 2 years, 4 semesters'
WHERE ""Regulator"" = 'UHPAB' AND ""Code"" IN ('CEC','CEH','CLT','CMR','CTA','CPH');

-- Additional programmes appearing in UHPAB's signed December 2025 assessment timetable.
-- These are programme records, not school offerings. Course/year/semester mappings remain
-- provisional until confirmed against each approved curriculum.
INSERT INTO ""Programmes""
(""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
VALUES
(gen_random_uuid(),NULL,'ORD','Diploma in Ear, Nose and Throat Surgery','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'OPM','Diploma in Orthopaedic Medicine','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DCN','Diploma in Clinical and Community Nutrition','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'ENTO','Diploma in Medical Entomology and Parasitology','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'HCO','Higher Diploma in Clinical Ophthalmology','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DOR','Higher Diploma in Ear, Nose and Throat Surgery','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DAN','Higher Diploma in Anaesthesia','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DEC','Higher Diploma in Emergency Care','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'HDP','Higher Diploma in Clinical Psychiatry','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DLM','Higher Diploma in Health Leadership and Management','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'HPE','Higher Diploma in Health Promotion and Education','Higher Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'ADPHN','Advanced Diploma in Public Health Nursing','Advanced Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'ADCCN','Advanced Diploma in Critical Care Nursing','Advanced Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DCND','Diploma in Comprehensive Nursing Direct','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DMHND','Diploma in Mental Health Nursing Direct','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DND','Diploma in Nursing Direct','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DMD','Diploma in Midwifery Direct','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DMHNE','Diploma in Mental Health Nursing Extension','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DNE','Diploma in Nursing Extension','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DME','Diploma in Midwifery Extension','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE),
(gen_random_uuid(),NULL,'DMEL','Diploma in Midwifery Extension (E-Learning)','Diploma',NULL,0,'Not specified','Full-time','Academic',0,'UHPAB',NULL,NULL,'ListedForReview','UHPAB December 2025 Semester Assessment timetable (27 Nov 2025)',FALSE,TRUE)
ON CONFLICT (""Code"") DO NOTHING;

-- UVTAB's official assessor application lists the programmes/papers assessors may select.
-- The public UVTAB curriculum repository currently reports zero published curriculum records.
-- Consequently these entries are reference-only and are not assigned invented course units,
-- year levels, semester numbers or durations.
INSERT INTO ""Programmes""
(""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
VALUES
(gen_random_uuid(),NULL,'UVTAB-ATD','Accounting Technicians Diploma','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register: https://assess.uvtab.go.ug/org/apply/',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DACF','Diploma in Accounting and Finance','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DABM','Diploma in Agribusiness Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DAPM','Diploma in Agricultural Production and Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DAF','Diploma in Agroforestry','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DBK','Diploma in Beekeeping','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DBE','Diploma in Biomedical Engineering','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DBA','Diploma in Business Administration','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DCIS','Diploma in Computing and Information Systems','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DCPB','Diploma in Crop Production and Business Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DCA','Diploma in Culinary Arts','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DEBM','Diploma in Entrepreneurship and Business Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DFMT','Diploma in Fisheries Management and Technologies','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DFSN','Diploma in Food Science and Nutrition','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DFO','Diploma in Forestry','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DHIC','Diploma in Hotel and Institutional Catering','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DHRM','Diploma in Human Resource Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DPLM','Diploma in Procurement and Logistics Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DSIM','Diploma in Secretarial Studies and Information Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DTM','Diploma in Tourism Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-DWNM','Diploma in Wildlife and Natural Resource Management','Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCA','National Certificate in Accountancy','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCAF','National Certificate in Accounting and Finance','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCAB','National Certificate in Agribusiness Management','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCAP','National Certificate in Agricultural Production','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCBE','National Certificate in Biomedical Engineering','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCBC','National Certificate in Building Construction','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCBA','National Certificate in Business Administration','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCAM','National Certificate in Automotive Mechanics','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCCM','National Certificate in Computer Maintenance and Repair','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCES','National Certificate in Electrical Installation Systems and Maintenance','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCFD','National Certificate in Fashion and Garment Design','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCHIC','National Certificate in Hotel and Institutional Catering','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCICT','National Certificate in Information and Communication Technology','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCLMG','National Certificate in Land Management and Geomatics','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCPB','National Certificate in Pastry and Bakery','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCPL','National Certificate in Plumbing','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCPLM','National Certificate in Procurement and Logistics Management','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCRM','National Certificate in Records and Information Management','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCSOM','National Certificate in Secretarial and Office Management','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCSWA','National Certificate in Social Work and Social Administration','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCTHM','National Certificate in Tourism and Hospitality Management','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NCWF','National Certificate in Welding and Fabrication','National Certificate',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDCE','National Diploma in Civil Engineering','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDEE','National Diploma in Electrical Engineering','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDME','National Diploma in Mechanical Engineering','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDICT','National Diploma in Information and Communication Technology','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDTM','National Diploma in Tourism Management','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDCP','National Diploma in Crop Production and Management','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDAH','National Diploma in Animal Health','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDABM','National Diploma in Agri-Business Management','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDHM','National Diploma in Hotel Management','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDPB','National Diploma in Pastry and Bakery','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDRA','National Diploma in Refrigeration and Air Conditioning','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE),
(gen_random_uuid(),NULL,'UVTAB-NDLSG','National Diploma in Land Surveying and Geomatics','National Diploma',NULL,0,'Not specified','Full-time','CompetencyBased',0,'UVTAB',NULL,NULL,'ListedForReview','UVTAB Assessor Application programme register',TRUE,TRUE)
ON CONFLICT (""Code"") DO NOTHING;
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Retain catalogue records on rollback; deleting them could invalidate student or
        // curriculum references created after the migration was applied.
    }
}
