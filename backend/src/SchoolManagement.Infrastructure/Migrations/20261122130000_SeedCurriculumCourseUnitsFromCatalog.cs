using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261122130000_SeedCurriculumCourseUnitsFromCatalog")]
public partial class SeedCurriculumCourseUnitsFromCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- ============================================================================
-- Curriculum and Course-Unit Mappings seeded from KSHS Master Curriculum Catalog
-- (26-page PDF, extracted and integrated 2026-11-22)
-- Version: KSHS-CATALOG-2026-11
-- ============================================================================

-- Helper: create curricula for each programme from the catalog
-- We match programmes by code and regulator, then insert a curriculum row.

-- UHPAB - Certificate in Nursing (CN) — 5 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Nursing (CN), 5 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CN' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Midwifery (CM) — 5 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Midwifery (CM), 5 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CM' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Nursing (DN/DND) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Nursing (DN/DND), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='DN' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Midwifery (DM/DMD) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Midwifery (DM/DMD), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='DM' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Clinical Medicine & Community Health (DCM) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Clinical Medicine and Community Health (DCM), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='DCM' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Pharmacy (CPH) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Pharmacy (CPH), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CPH' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Pharmacy (PHA) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Pharmacy (PHA), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='PHA' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Medical Laboratory Techniques (CLT) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Medical Laboratory Techniques (CLT), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CLT' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Medical Laboratory Technology (MLT) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Medical Laboratory Technology (MLT), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='MLT' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Medical Records & Health Informatics (CMR) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Medical Records and Health Informatics (CMR), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CMR' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Medical Records & Health Informatics (MER) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Medical Records and Health Informatics (MER), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='MER' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Emergency Care (CEC) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Emergency Care (CEC), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CEC' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Environmental Health Sciences (CEH) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Environmental Health Sciences (CEH), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CEH' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Medical Theatre Techniques (CTA) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Medical Theatre Techniques (CTA), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CTA' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Certificate in Mental Health Nursing (CMHN) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Mental Health Nursing (CMHN), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='CMHN' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- UHPAB - Diploma in Mental Health Nursing (DMHN/DMHND) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Mental Health Nursing (DMHN/DMHND), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='DMHN' AND p.""Regulator""='UHPAB'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Certificate in Public Health (SB-CPH) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Public Health (SB-CPH), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-CPH' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Diploma in Public Health (SB-DPH) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Public Health (SB-DPH), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-DPH' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Certificate in Food Science & Nutrition (KSHS-CFSN) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Food Science and Nutrition (KSHS-CFSN), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='KSHS-CFSN' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Diploma in Human Nutrition & Dietetics (SB-DHND) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Human Nutrition and Dietetics (SB-DHND), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-DHND' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Diploma in Food Science & Technology (KSHS-DFSN) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Food Science and Technology (KSHS-DFSN), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='KSHS-DFSN' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Diploma in Diagnostic Sonography (KSHS-DDS) — 6 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Diagnostic Sonography (KSHS-DDS), 6 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='KSHS-DDS' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Advanced Diploma in Diagnostic Sonography (SB-ADDS) — 2 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Advanced Diploma in Diagnostic Sonography (SB-ADDS), 2 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-ADDS' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Certificate in Biomedical Engineering (KSHS-CBME) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Certificate in Biomedical Engineering (KSHS-CBME), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='KSHS-CBME' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Diploma in Biomedical Engineering (KSHS-DBME) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Diploma in Biomedical Engineering (KSHS-DBME), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='KSHS-DBME' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Guidance & Counselling (SB-CGC / SB-DHCG) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Guidance and Counselling (SB-CGC / SB-DHCG), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-CGC' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Records Management (SB-CRM-C / SB-DRM) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Records Management (SB-CRM-C / SB-DRM), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-CRM-C' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Secretarial Studies & Office Management (KSHS-CSSOM / KSHS-DSSOM) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Secretarial Studies and Office Management (KSHS-CSSOM / KSHS-DSSOM), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='KSHS-CSSOM' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Advanced Diploma in Health Promotion & Education (SB-ADHPE) — 4 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Advanced Diploma in Health Promotion and Education (SB-ADHPE), 4 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-ADHPE' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- SCHOOL_BASED - Bridging Programme (SB-BRIDGE) — 2 Semesters
INSERT INTO ""Curricula"" (""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'KSHS-CATALOG-2026-11',
       'KSHS Catalog Curriculum — Bridging Programme (SB-BRIDGE), 2 Semesters',
       0,DATE '2026-01-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Code""='SB-BRIDGE' AND p.""Regulator""='SCHOOL_BASED'
  AND NOT EXISTS (SELECT 1 FROM ""Curricula"" cu WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='KSHS-CATALOG-2026-11');

-- ============================================================================
-- Course-Unit to Curriculum Mappings (YearOfStudy, SemesterNumber, IsCore=TRUE)
-- ============================================================================

-- CN - Certificate in Nursing
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CNUR 1101' THEN 1 WHEN 'CNUR 1102' THEN 1 WHEN 'CNUR 1103' THEN 1 WHEN 'CNUR 1104' THEN 1 WHEN 'CNUR 1105' THEN 1 WHEN 'CNUR 1106' THEN 1
    WHEN 'CNUR 1201' THEN 1 WHEN 'CNUR 1202' THEN 1 WHEN 'CNUR 1203' THEN 1 WHEN 'CNUR 1204' THEN 1 WHEN 'CNUR 1205' THEN 1 WHEN 'CNUR 1206' THEN 1
    WHEN 'CNUR 2101' THEN 2 WHEN 'CNUR 2102' THEN 2 WHEN 'CNUR 2103' THEN 2 WHEN 'CNUR 2104' THEN 2 WHEN 'CNUR 2105' THEN 2
    WHEN 'CNUR 2201' THEN 2 WHEN 'CNUR 2202' THEN 2 WHEN 'CNUR 2203' THEN 2 WHEN 'CNUR 2204' THEN 2 WHEN 'CNUR 2205' THEN 2
    WHEN 'CNUR 3101' THEN 3 WHEN 'CNUR 3102' THEN 3 WHEN 'CNUR 3103' THEN 3
  END,
  CASE c.""Code""
    WHEN 'CNUR 1101' THEN 1 WHEN 'CNUR 1102' THEN 1 WHEN 'CNUR 1103' THEN 1 WHEN 'CNUR 1104' THEN 1 WHEN 'CNUR 1105' THEN 1 WHEN 'CNUR 1106' THEN 1
    WHEN 'CNUR 1201' THEN 2 WHEN 'CNUR 1202' THEN 2 WHEN 'CNUR 1203' THEN 2 WHEN 'CNUR 1204' THEN 2 WHEN 'CNUR 1205' THEN 2 WHEN 'CNUR 1206' THEN 2
    WHEN 'CNUR 2101' THEN 1 WHEN 'CNUR 2102' THEN 1 WHEN 'CNUR 2103' THEN 1 WHEN 'CNUR 2104' THEN 1 WHEN 'CNUR 2105' THEN 1
    WHEN 'CNUR 2201' THEN 2 WHEN 'CNUR 2202' THEN 2 WHEN 'CNUR 2203' THEN 2 WHEN 'CNUR 2204' THEN 2 WHEN 'CNUR 2205' THEN 2
    WHEN 'CNUR 3101' THEN 1 WHEN 'CNUR 3102' THEN 1 WHEN 'CNUR 3103' THEN 1
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CN' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CNUR %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CM - Certificate in Midwifery
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CMID 1101' THEN 1 WHEN 'CMID 1102' THEN 1 WHEN 'CMID 1103' THEN 1 WHEN 'CMID 1104' THEN 1 WHEN 'CMID 1105' THEN 1
    WHEN 'CMID 1201' THEN 1 WHEN 'CMID 1202' THEN 1 WHEN 'CMID 1203' THEN 1 WHEN 'CMID 1204' THEN 1 WHEN 'CMID 1205' THEN 1
    WHEN 'CMID 2101' THEN 2 WHEN 'CMID 2102' THEN 2 WHEN 'CMID 2103' THEN 2 WHEN 'CMID 2104' THEN 2
    WHEN 'CMID 2201' THEN 2 WHEN 'CMID 2202' THEN 2 WHEN 'CMID 2203' THEN 2 WHEN 'CMID 2204' THEN 2
    WHEN 'CMID 3101' THEN 3 WHEN 'CMID 3102' THEN 3 WHEN 'CMID 3103' THEN 3
  END,
  CASE c.""Code""
    WHEN 'CMID 1101' THEN 1 WHEN 'CMID 1102' THEN 1 WHEN 'CMID 1103' THEN 1 WHEN 'CMID 1104' THEN 1 WHEN 'CMID 1105' THEN 1
    WHEN 'CMID 1201' THEN 2 WHEN 'CMID 1202' THEN 2 WHEN 'CMID 1203' THEN 2 WHEN 'CMID 1204' THEN 2 WHEN 'CMID 1205' THEN 2
    WHEN 'CMID 2101' THEN 1 WHEN 'CMID 2102' THEN 1 WHEN 'CMID 2103' THEN 1 WHEN 'CMID 2104' THEN 1
    WHEN 'CMID 2201' THEN 2 WHEN 'CMID 2202' THEN 2 WHEN 'CMID 2203' THEN 2 WHEN 'CMID 2204' THEN 2
    WHEN 'CMID 3101' THEN 1 WHEN 'CMID 3102' THEN 1 WHEN 'CMID 3103' THEN 1
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CM' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CMID %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- DN - Diploma in Nursing
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DNUR 1101' THEN 1 WHEN 'DNUR 1102' THEN 1 WHEN 'DNUR 1103' THEN 1 WHEN 'DNUR 1104' THEN 1 WHEN 'DNUR 1105' THEN 1
    WHEN 'DNUR 1201' THEN 1 WHEN 'DNUR 1202' THEN 1 WHEN 'DNUR 1203' THEN 1 WHEN 'DNUR 1204' THEN 1 WHEN 'DNUR 1205' THEN 1
    WHEN 'DNUR 2101' THEN 2 WHEN 'DNUR 2102' THEN 2 WHEN 'DNUR 2103' THEN 2 WHEN 'DNUR 2104' THEN 2 WHEN 'DNUR 2105' THEN 2
    WHEN 'DNUR 2201' THEN 2 WHEN 'DNUR 2202' THEN 2 WHEN 'DNUR 2203' THEN 2 WHEN 'DNUR 2204' THEN 2 WHEN 'DNUR 2205' THEN 2
    WHEN 'DNUR 3101' THEN 3 WHEN 'DNUR 3102' THEN 3 WHEN 'DNUR 3103' THEN 3 WHEN 'DNUR 3104' THEN 3 WHEN 'DNUR 3105' THEN 3
    WHEN 'DNUR 3201' THEN 3 WHEN 'DNUR 3202' THEN 3 WHEN 'DNUR 3203' THEN 3 WHEN 'DNUR 3204' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DNUR 1101' THEN 1 WHEN 'DNUR 1102' THEN 1 WHEN 'DNUR 1103' THEN 1 WHEN 'DNUR 1104' THEN 1 WHEN 'DNUR 1105' THEN 1
    WHEN 'DNUR 1201' THEN 2 WHEN 'DNUR 1202' THEN 2 WHEN 'DNUR 1203' THEN 2 WHEN 'DNUR 1204' THEN 2 WHEN 'DNUR 1205' THEN 2
    WHEN 'DNUR 2101' THEN 1 WHEN 'DNUR 2102' THEN 1 WHEN 'DNUR 2103' THEN 1 WHEN 'DNUR 2104' THEN 1 WHEN 'DNUR 2105' THEN 1
    WHEN 'DNUR 2201' THEN 2 WHEN 'DNUR 2202' THEN 2 WHEN 'DNUR 2203' THEN 2 WHEN 'DNUR 2204' THEN 2 WHEN 'DNUR 2205' THEN 2
    WHEN 'DNUR 3101' THEN 1 WHEN 'DNUR 3102' THEN 1 WHEN 'DNUR 3103' THEN 1 WHEN 'DNUR 3104' THEN 1 WHEN 'DNUR 3105' THEN 1
    WHEN 'DNUR 3201' THEN 2 WHEN 'DNUR 3202' THEN 2 WHEN 'DNUR 3203' THEN 2 WHEN 'DNUR 3204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='DN' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DNUR %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- DM - Diploma in Midwifery
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DMID 1101' THEN 1 WHEN 'DMID 1102' THEN 1 WHEN 'DMID 1103' THEN 1 WHEN 'DMID 1104' THEN 1 WHEN 'DMID 1105' THEN 1
    WHEN 'DMID 1201' THEN 1 WHEN 'DMID 1202' THEN 1 WHEN 'DMID 1203' THEN 1 WHEN 'DMID 1204' THEN 1 WHEN 'DMID 1205' THEN 1
    WHEN 'DMID 2101' THEN 2 WHEN 'DMID 2102' THEN 2 WHEN 'DMID 2103' THEN 2 WHEN 'DMID 2104' THEN 2 WHEN 'DMID 2105' THEN 2
    WHEN 'DMID 2201' THEN 2 WHEN 'DMID 2202' THEN 2 WHEN 'DMID 2203' THEN 2 WHEN 'DMID 2204' THEN 2
    WHEN 'DMID 3101' THEN 3 WHEN 'DMID 3102' THEN 3 WHEN 'DMID 3103' THEN 3 WHEN 'DMID 3104' THEN 3
    WHEN 'DMID 3201' THEN 3 WHEN 'DMID 3202' THEN 3 WHEN 'DMID 3203' THEN 3 WHEN 'DMID 3204' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DMID 1101' THEN 1 WHEN 'DMID 1102' THEN 1 WHEN 'DMID 1103' THEN 1 WHEN 'DMID 1104' THEN 1 WHEN 'DMID 1105' THEN 1
    WHEN 'DMID 1201' THEN 2 WHEN 'DMID 1202' THEN 2 WHEN 'DMID 1203' THEN 2 WHEN 'DMID 1204' THEN 2 WHEN 'DMID 1205' THEN 2
    WHEN 'DMID 2101' THEN 1 WHEN 'DMID 2102' THEN 1 WHEN 'DMID 2103' THEN 1 WHEN 'DMID 2104' THEN 1 WHEN 'DMID 2105' THEN 1
    WHEN 'DMID 2201' THEN 2 WHEN 'DMID 2202' THEN 2 WHEN 'DMID 2203' THEN 2 WHEN 'DMID 2204' THEN 2
    WHEN 'DMID 3101' THEN 1 WHEN 'DMID 3102' THEN 1 WHEN 'DMID 3103' THEN 1 WHEN 'DMID 3104' THEN 1
    WHEN 'DMID 3201' THEN 2 WHEN 'DMID 3202' THEN 2 WHEN 'DMID 3203' THEN 2 WHEN 'DMID 3204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='DM' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DMID %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- DCM - Diploma in Clinical Medicine & Community Health
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DCM 1101' THEN 1 WHEN 'DCM 1102' THEN 1 WHEN 'DCM 1103' THEN 1 WHEN 'DCM 1104' THEN 1 WHEN 'DCM 1105' THEN 1 WHEN 'DCM 1106' THEN 1
    WHEN 'DCM 1201' THEN 1 WHEN 'DCM 1202' THEN 1 WHEN 'DCM 1203' THEN 1 WHEN 'DCM 1204' THEN 1 WHEN 'DCM 1205' THEN 1 WHEN 'DCM 1206' THEN 1
    WHEN 'DCM 2101' THEN 2 WHEN 'DCM 2102' THEN 2 WHEN 'DCM 2103' THEN 2 WHEN 'DCM 2104' THEN 2 WHEN 'DCM 2105' THEN 2
    WHEN 'DCM 2201' THEN 2 WHEN 'DCM 2202' THEN 2 WHEN 'DCM 2203' THEN 2 WHEN 'DCM 2204' THEN 2 WHEN 'DCM 2205' THEN 2
    WHEN 'DCM 3101' THEN 3 WHEN 'DCM 3102' THEN 3 WHEN 'DCM 3103' THEN 3 WHEN 'DCM 3104' THEN 3 WHEN 'DCM 3105' THEN 3
    WHEN 'DCM 3201' THEN 3 WHEN 'DCM 3202' THEN 3 WHEN 'DCM 3203' THEN 3 WHEN 'DCM 3204' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DCM 1101' THEN 1 WHEN 'DCM 1102' THEN 1 WHEN 'DCM 1103' THEN 1 WHEN 'DCM 1104' THEN 1 WHEN 'DCM 1105' THEN 1 WHEN 'DCM 1106' THEN 1
    WHEN 'DCM 1201' THEN 2 WHEN 'DCM 1202' THEN 2 WHEN 'DCM 1203' THEN 2 WHEN 'DCM 1204' THEN 2 WHEN 'DCM 1205' THEN 2 WHEN 'DCM 1206' THEN 2
    WHEN 'DCM 2101' THEN 1 WHEN 'DCM 2102' THEN 1 WHEN 'DCM 2103' THEN 1 WHEN 'DCM 2104' THEN 1 WHEN 'DCM 2105' THEN 1
    WHEN 'DCM 2201' THEN 2 WHEN 'DCM 2202' THEN 2 WHEN 'DCM 2203' THEN 2 WHEN 'DCM 2204' THEN 2 WHEN 'DCM 2205' THEN 2
    WHEN 'DCM 3101' THEN 1 WHEN 'DCM 3102' THEN 1 WHEN 'DCM 3103' THEN 1 WHEN 'DCM 3104' THEN 1 WHEN 'DCM 3105' THEN 1
    WHEN 'DCM 3201' THEN 2 WHEN 'DCM 3202' THEN 2 WHEN 'DCM 3203' THEN 2 WHEN 'DCM 3204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='DCM' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DCM %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CPH - Certificate in Pharmacy
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CPHA 1101' THEN 1 WHEN 'CPHA 1102' THEN 1 WHEN 'CPHA 1103' THEN 1 WHEN 'CPHA 1104' THEN 1 WHEN 'CPHA 1105' THEN 1 WHEN 'CPHA 1106' THEN 1
    WHEN 'CPHA 1201' THEN 1 WHEN 'CPHA 1202' THEN 1 WHEN 'CPHA 1203' THEN 1 WHEN 'CPHA 1204' THEN 1 WHEN 'CPHA 1205' THEN 1 WHEN 'CPHA 1206' THEN 1
    WHEN 'CPHA 2101' THEN 2 WHEN 'CPHA 2102' THEN 2 WHEN 'CPHA 2103' THEN 2 WHEN 'CPHA 2104' THEN 2 WHEN 'CPHA 2105' THEN 2 WHEN 'CPHA 2107' THEN 2 WHEN 'CPHA 2106' THEN 2
    WHEN 'CPHA 2201' THEN 2 WHEN 'CPHA 2202' THEN 2 WHEN 'CPHA 2203' THEN 2 WHEN 'CPHA 2204' THEN 2 WHEN 'CPHA 2205' THEN 2 WHEN 'CPHA 2206' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CPHA 1101' THEN 1 WHEN 'CPHA 1102' THEN 1 WHEN 'CPHA 1103' THEN 1 WHEN 'CPHA 1104' THEN 1 WHEN 'CPHA 1105' THEN 1 WHEN 'CPHA 1106' THEN 1
    WHEN 'CPHA 1201' THEN 2 WHEN 'CPHA 1202' THEN 2 WHEN 'CPHA 1203' THEN 2 WHEN 'CPHA 1204' THEN 2 WHEN 'CPHA 1205' THEN 2 WHEN 'CPHA 1206' THEN 2
    WHEN 'CPHA 2101' THEN 1 WHEN 'CPHA 2102' THEN 1 WHEN 'CPHA 2103' THEN 1 WHEN 'CPHA 2104' THEN 1 WHEN 'CPHA 2105' THEN 1 WHEN 'CPHA 2107' THEN 1 WHEN 'CPHA 2106' THEN 1
    WHEN 'CPHA 2201' THEN 2 WHEN 'CPHA 2202' THEN 2 WHEN 'CPHA 2203' THEN 2 WHEN 'CPHA 2204' THEN 2 WHEN 'CPHA 2205' THEN 2 WHEN 'CPHA 2206' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CPH' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CPHA %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- PHA - Diploma in Pharmacy
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DPHA 1101' THEN 1 WHEN 'DPHA 1102' THEN 1 WHEN 'DPHA 1103' THEN 1 WHEN 'DPHA 1104' THEN 1 WHEN 'DPHA 1105' THEN 1
    WHEN 'DPHA 1201' THEN 1 WHEN 'DPHA 1202' THEN 1 WHEN 'DPHA 1203' THEN 1 WHEN 'DPHA 1204' THEN 1 WHEN 'DPHA 1205' THEN 1
    WHEN 'DPHA 2101' THEN 2 WHEN 'DPHA 2102' THEN 2 WHEN 'DPHA 2103' THEN 2 WHEN 'DPHA 2104' THEN 2 WHEN 'DPHA 2105' THEN 2
    WHEN 'DPHA 2201' THEN 2 WHEN 'DPHA 2202' THEN 2 WHEN 'DPHA 2203' THEN 2 WHEN 'DPHA 2204' THEN 2 WHEN 'DPHA 2205' THEN 2
    WHEN 'DPHA 3101' THEN 3 WHEN 'DPHA 3102' THEN 3 WHEN 'DPHA 3103' THEN 3 WHEN 'DPHA 3104' THEN 3 WHEN 'DPHA 3105' THEN 3
    WHEN 'DPHA 3201' THEN 3 WHEN 'DPHA 3202' THEN 3 WHEN 'DPHA 3203' THEN 3 WHEN 'DPHA 3204' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DPHA 1101' THEN 1 WHEN 'DPHA 1102' THEN 1 WHEN 'DPHA 1103' THEN 1 WHEN 'DPHA 1104' THEN 1 WHEN 'DPHA 1105' THEN 1
    WHEN 'DPHA 1201' THEN 2 WHEN 'DPHA 1202' THEN 2 WHEN 'DPHA 1203' THEN 2 WHEN 'DPHA 1204' THEN 2 WHEN 'DPHA 1205' THEN 2
    WHEN 'DPHA 2101' THEN 1 WHEN 'DPHA 2102' THEN 1 WHEN 'DPHA 2103' THEN 1 WHEN 'DPHA 2104' THEN 1 WHEN 'DPHA 2105' THEN 1
    WHEN 'DPHA 2201' THEN 2 WHEN 'DPHA 2202' THEN 2 WHEN 'DPHA 2203' THEN 2 WHEN 'DPHA 2204' THEN 2 WHEN 'DPHA 2205' THEN 2
    WHEN 'DPHA 3101' THEN 1 WHEN 'DPHA 3102' THEN 1 WHEN 'DPHA 3103' THEN 1 WHEN 'DPHA 3104' THEN 1 WHEN 'DPHA 3105' THEN 1
    WHEN 'DPHA 3201' THEN 2 WHEN 'DPHA 3202' THEN 2 WHEN 'DPHA 3203' THEN 2 WHEN 'DPHA 3204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='PHA' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DPHA %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CLT - Certificate in Medical Laboratory Techniques
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CMLT 1101' THEN 1 WHEN 'CMLT 1102' THEN 1 WHEN 'CMLT 1103' THEN 1 WHEN 'CMLT 1104' THEN 1 WHEN 'CMLT 1105' THEN 1
    WHEN 'CMLT 1201' THEN 1 WHEN 'CMLT 1202' THEN 1 WHEN 'CMLT 1203' THEN 1 WHEN 'CMLT 1204' THEN 1 WHEN 'CMLT 1205' THEN 1
    WHEN 'CMLT 2101' THEN 2 WHEN 'CMLT 2102' THEN 2 WHEN 'CMLT 2103' THEN 2 WHEN 'CMLT 2104' THEN 2 WHEN 'CMLT 2105' THEN 2
    WHEN 'CMLT 2201' THEN 2 WHEN 'CMLT 2202' THEN 2 WHEN 'CMLT 2203' THEN 2 WHEN 'CMLT 2204' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CMLT 1101' THEN 1 WHEN 'CMLT 1102' THEN 1 WHEN 'CMLT 1103' THEN 1 WHEN 'CMLT 1104' THEN 1 WHEN 'CMLT 1105' THEN 1
    WHEN 'CMLT 1201' THEN 2 WHEN 'CMLT 1202' THEN 2 WHEN 'CMLT 1203' THEN 2 WHEN 'CMLT 1204' THEN 2 WHEN 'CMLT 1205' THEN 2
    WHEN 'CMLT 2101' THEN 1 WHEN 'CMLT 2102' THEN 1 WHEN 'CMLT 2103' THEN 1 WHEN 'CMLT 2104' THEN 1 WHEN 'CMLT 2105' THEN 1
    WHEN 'CMLT 2201' THEN 2 WHEN 'CMLT 2202' THEN 2 WHEN 'CMLT 2203' THEN 2 WHEN 'CMLT 2204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CLT' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CMLT %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- MLT - Diploma in Medical Laboratory Technology
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DMLT 1101' THEN 1 WHEN 'DMLT 1102' THEN 1 WHEN 'DMLT 1103' THEN 1 WHEN 'DMLT 1104' THEN 1
    WHEN 'DMLT 1201' THEN 1 WHEN 'DMLT 1202' THEN 1 WHEN 'DMLT 1203' THEN 1 WHEN 'DMLT 1204' THEN 1
    WHEN 'DMLT 2101' THEN 2 WHEN 'DMLT 2102' THEN 2 WHEN 'DMLT 2103' THEN 2 WHEN 'DMLT 2104' THEN 2 WHEN 'DMLT 2105' THEN 2
    WHEN 'DMLT 2201' THEN 2 WHEN 'DMLT 2202' THEN 2 WHEN 'DMLT 2203' THEN 2 WHEN 'DMLT 2204' THEN 2 WHEN 'DMLT 2205' THEN 2
    WHEN 'DMLT 3101' THEN 3 WHEN 'DMLT 3102' THEN 3 WHEN 'DMLT 3103' THEN 3 WHEN 'DMLT 3104' THEN 3
    WHEN 'DMLT 3201' THEN 3 WHEN 'DMLT 3202' THEN 3 WHEN 'DMLT 3203' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DMLT 1101' THEN 1 WHEN 'DMLT 1102' THEN 1 WHEN 'DMLT 1103' THEN 1 WHEN 'DMLT 1104' THEN 1
    WHEN 'DMLT 1201' THEN 2 WHEN 'DMLT 1202' THEN 2 WHEN 'DMLT 1203' THEN 2 WHEN 'DMLT 1204' THEN 2
    WHEN 'DMLT 2101' THEN 1 WHEN 'DMLT 2102' THEN 1 WHEN 'DMLT 2103' THEN 1 WHEN 'DMLT 2104' THEN 1 WHEN 'DMLT 2105' THEN 1
    WHEN 'DMLT 2201' THEN 2 WHEN 'DMLT 2202' THEN 2 WHEN 'DMLT 2203' THEN 2 WHEN 'DMLT 2204' THEN 2 WHEN 'DMLT 2205' THEN 2
    WHEN 'DMLT 3101' THEN 1 WHEN 'DMLT 3102' THEN 1 WHEN 'DMLT 3103' THEN 1 WHEN 'DMLT 3104' THEN 1
    WHEN 'DMLT 3201' THEN 2 WHEN 'DMLT 3202' THEN 2 WHEN 'DMLT 3203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='MLT' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DMLT %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CMR - Certificate in Medical Records & Health Informatics
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CMRI 1101' THEN 1 WHEN 'CMRI 1102' THEN 1 WHEN 'CMRI 1103' THEN 1 WHEN 'CMRI 1104' THEN 1
    WHEN 'CMRI 1201' THEN 1 WHEN 'CMRI 1202' THEN 1 WHEN 'CMRI 1203' THEN 1 WHEN 'CMRI 1204' THEN 1
    WHEN 'CMRI 2101' THEN 2 WHEN 'CMRI 2102' THEN 2 WHEN 'CMRI 2103' THEN 2 WHEN 'CMRI 2104' THEN 2
    WHEN 'CMRI 2201' THEN 2 WHEN 'CMRI 2202' THEN 2 WHEN 'CMRI 2203' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CMRI 1101' THEN 1 WHEN 'CMRI 1102' THEN 1 WHEN 'CMRI 1103' THEN 1 WHEN 'CMRI 1104' THEN 1
    WHEN 'CMRI 1201' THEN 2 WHEN 'CMRI 1202' THEN 2 WHEN 'CMRI 1203' THEN 2 WHEN 'CMRI 1204' THEN 2
    WHEN 'CMRI 2101' THEN 1 WHEN 'CMRI 2102' THEN 1 WHEN 'CMRI 2103' THEN 1 WHEN 'CMRI 2104' THEN 1
    WHEN 'CMRI 2201' THEN 2 WHEN 'CMRI 2202' THEN 2 WHEN 'CMRI 2203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CMR' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CMRI %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- MER - Diploma in Medical Records & Health Informatics
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DMRI 1101' THEN 1 WHEN 'DMRI 1102' THEN 1 WHEN 'DMRI 1103' THEN 1 WHEN 'DMRI 1104' THEN 1
    WHEN 'DMRI 1201' THEN 1 WHEN 'DMRI 1202' THEN 1 WHEN 'DMRI 1203' THEN 1 WHEN 'DMRI 1204' THEN 1
    WHEN 'DMRI 2101' THEN 2 WHEN 'DMRI 2102' THEN 2 WHEN 'DMRI 2103' THEN 2 WHEN 'DMRI 2104' THEN 2
    WHEN 'DMRI 2201' THEN 2 WHEN 'DMRI 2202' THEN 2 WHEN 'DMRI 2203' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DMRI 1101' THEN 1 WHEN 'DMRI 1102' THEN 1 WHEN 'DMRI 1103' THEN 1 WHEN 'DMRI 1104' THEN 1
    WHEN 'DMRI 1201' THEN 2 WHEN 'DMRI 1202' THEN 2 WHEN 'DMRI 1203' THEN 2 WHEN 'DMRI 1204' THEN 2
    WHEN 'DMRI 2101' THEN 1 WHEN 'DMRI 2102' THEN 1 WHEN 'DMRI 2103' THEN 1 WHEN 'DMRI 2104' THEN 1
    WHEN 'DMRI 2201' THEN 2 WHEN 'DMRI 2202' THEN 2 WHEN 'DMRI 2203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='MER' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DMRI %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CEC - Certificate in Emergency Care
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CEC 1101' THEN 1 WHEN 'CEC 1102' THEN 1
    WHEN 'CEC 1201' THEN 1 WHEN 'CEC 1202' THEN 1
    WHEN 'CEC 2101' THEN 2 WHEN 'CEC 2102' THEN 2
    WHEN 'CEC 2201' THEN 2 WHEN 'CEC 2202' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CEC 1101' THEN 1 WHEN 'CEC 1102' THEN 1
    WHEN 'CEC 1201' THEN 2 WHEN 'CEC 1202' THEN 2
    WHEN 'CEC 2101' THEN 1 WHEN 'CEC 2102' THEN 1
    WHEN 'CEC 2201' THEN 2 WHEN 'CEC 2202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CEC' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CEC %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CEH - Certificate in Environmental Health Sciences
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CEH 1101' THEN 1 WHEN 'CEH 1102' THEN 1
    WHEN 'CEH 1201' THEN 1 WHEN 'CEH 1202' THEN 1
    WHEN 'CEH 2101' THEN 2 WHEN 'CEH 2102' THEN 2
    WHEN 'CEH 2201' THEN 2 WHEN 'CEH 2202' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CEH 1101' THEN 1 WHEN 'CEH 1102' THEN 1
    WHEN 'CEH 1201' THEN 2 WHEN 'CEH 1202' THEN 2
    WHEN 'CEH 2101' THEN 1 WHEN 'CEH 2102' THEN 1
    WHEN 'CEH 2201' THEN 2 WHEN 'CEH 2202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CEH' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CEH %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CTA - Certificate in Medical Theatre Techniques
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CTA 1101' THEN 1 WHEN 'CTA 1102' THEN 1
    WHEN 'CTA 1201' THEN 1 WHEN 'CTA 1202' THEN 1
    WHEN 'CTA 2101' THEN 2 WHEN 'CTA 2102' THEN 2
    WHEN 'CTA 2201' THEN 2 WHEN 'CTA 2202' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CTA 1101' THEN 1 WHEN 'CTA 1102' THEN 1
    WHEN 'CTA 1201' THEN 2 WHEN 'CTA 1202' THEN 2
    WHEN 'CTA 2101' THEN 1 WHEN 'CTA 2102' THEN 1
    WHEN 'CTA 2201' THEN 2 WHEN 'CTA 2202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CTA' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CTA %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- CMHN - Certificate in Mental Health Nursing
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CMHN 1101' THEN 1 WHEN 'CMHN 1102' THEN 1
    WHEN 'CMHN 1201' THEN 1 WHEN 'CMHN 1202' THEN 1
    WHEN 'CMHN 2101' THEN 2 WHEN 'CMHN 2102' THEN 2
    WHEN 'CMHN 2201' THEN 2 WHEN 'CMHN 2202' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CMHN 1101' THEN 1 WHEN 'CMHN 1102' THEN 1
    WHEN 'CMHN 1201' THEN 2 WHEN 'CMHN 1202' THEN 2
    WHEN 'CMHN 2101' THEN 1 WHEN 'CMHN 2102' THEN 1
    WHEN 'CMHN 2201' THEN 2 WHEN 'CMHN 2202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='CMHN' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CMHN %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- DMHN - Diploma in Mental Health Nursing
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DMHN 1101' THEN 1 WHEN 'DMHN 1201' THEN 1
    WHEN 'DMHN 2101' THEN 2 WHEN 'DMHN 2201' THEN 2
    WHEN 'DMHN 3101' THEN 3 WHEN 'DMHN 3201' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DMHN 1101' THEN 1 WHEN 'DMHN 1201' THEN 2
    WHEN 'DMHN 2101' THEN 1 WHEN 'DMHN 2201' THEN 2
    WHEN 'DMHN 3101' THEN 1 WHEN 'DMHN 3201' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='DMHN' AND p.""Regulator""='UHPAB'
JOIN ""Courses"" c ON c.""AuthorityCode""='UHPAB'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DMHN %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Certificate in Public Health (SB-CPH)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CPH 1101' THEN 1 WHEN 'CPH 1102' THEN 1 WHEN 'CPH 1103' THEN 1 WHEN 'CPH 1104' THEN 1
    WHEN 'CPH 1201' THEN 1 WHEN 'CPH 1202' THEN 1 WHEN 'CPH 1203' THEN 1 WHEN 'CPH 1204' THEN 1
    WHEN 'CPH 2101' THEN 2 WHEN 'CPH 2102' THEN 2 WHEN 'CPH 2103' THEN 2 WHEN 'CPH 2104' THEN 2
    WHEN 'CPH 2201' THEN 2 WHEN 'CPH 2202' THEN 2 WHEN 'CPH 2203' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CPH 1101' THEN 1 WHEN 'CPH 1102' THEN 1 WHEN 'CPH 1103' THEN 1 WHEN 'CPH 1104' THEN 1
    WHEN 'CPH 1201' THEN 2 WHEN 'CPH 1202' THEN 2 WHEN 'CPH 1203' THEN 2 WHEN 'CPH 1204' THEN 2
    WHEN 'CPH 2101' THEN 1 WHEN 'CPH 2102' THEN 1 WHEN 'CPH 2103' THEN 1 WHEN 'CPH 2104' THEN 1
    WHEN 'CPH 2201' THEN 2 WHEN 'CPH 2202' THEN 2 WHEN 'CPH 2203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-CPH' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CPH %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Diploma in Public Health (SB-DPH)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DPH 1101' THEN 1 WHEN 'DPH 1102' THEN 1 WHEN 'DPH 1103' THEN 1 WHEN 'DPH 1104' THEN 1
    WHEN 'DPH 1201' THEN 1 WHEN 'DPH 1202' THEN 1 WHEN 'DPH 1203' THEN 1 WHEN 'DPH 1204' THEN 1
    WHEN 'DPH 2101' THEN 2 WHEN 'DPH 2102' THEN 2 WHEN 'DPH 2103' THEN 2 WHEN 'DPH 2104' THEN 2
    WHEN 'DPH 2201' THEN 2 WHEN 'DPH 2202' THEN 2 WHEN 'DPH 2203' THEN 2 WHEN 'DPH 2204' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DPH 1101' THEN 1 WHEN 'DPH 1102' THEN 1 WHEN 'DPH 1103' THEN 1 WHEN 'DPH 1104' THEN 1
    WHEN 'DPH 1201' THEN 2 WHEN 'DPH 1202' THEN 2 WHEN 'DPH 1203' THEN 2 WHEN 'DPH 1204' THEN 2
    WHEN 'DPH 2101' THEN 1 WHEN 'DPH 2102' THEN 1 WHEN 'DPH 2103' THEN 1 WHEN 'DPH 2104' THEN 1
    WHEN 'DPH 2201' THEN 2 WHEN 'DPH 2202' THEN 2 WHEN 'DPH 2203' THEN 2 WHEN 'DPH 2204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-DPH' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DPH %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Certificate in Food Science & Nutrition (KSHS-CFSN)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CFSN 1101' THEN 1 WHEN 'CFSN 1102' THEN 1 WHEN 'CFSN 1103' THEN 1 WHEN 'CFSN 1104' THEN 1
    WHEN 'CFSN 1201' THEN 1 WHEN 'CFSN 1202' THEN 1 WHEN 'CFSN 1203' THEN 1 WHEN 'CFSN 1204' THEN 1
    WHEN 'CFSN 2101' THEN 2 WHEN 'CFSN 2102' THEN 2 WHEN 'CFSN 2103' THEN 2 WHEN 'CFSN 2104' THEN 2
    WHEN 'CFSN 2201' THEN 2 WHEN 'CFSN 2202' THEN 2 WHEN 'CFSN 2203' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CFSN 1101' THEN 1 WHEN 'CFSN 1102' THEN 1 WHEN 'CFSN 1103' THEN 1 WHEN 'CFSN 1104' THEN 1
    WHEN 'CFSN 1201' THEN 2 WHEN 'CFSN 1202' THEN 2 WHEN 'CFSN 1203' THEN 2 WHEN 'CFSN 1204' THEN 2
    WHEN 'CFSN 2101' THEN 1 WHEN 'CFSN 2102' THEN 1 WHEN 'CFSN 2103' THEN 1 WHEN 'CFSN 2104' THEN 1
    WHEN 'CFSN 2201' THEN 2 WHEN 'CFSN 2202' THEN 2 WHEN 'CFSN 2203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='KSHS-CFSN' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CFSN %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Diploma in Human Nutrition & Dietetics (SB-DHND)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DHND 1101' THEN 1 WHEN 'DHND 1102' THEN 1 WHEN 'DHND 1103' THEN 1 WHEN 'DHND 1104' THEN 1
    WHEN 'DHND 1201' THEN 1 WHEN 'DHND 1202' THEN 1 WHEN 'DHND 1203' THEN 1 WHEN 'DHND 1204' THEN 1
    WHEN 'DHND 2101' THEN 2 WHEN 'DHND 2102' THEN 2 WHEN 'DHND 2103' THEN 2 WHEN 'DHND 2104' THEN 2
    WHEN 'DHND 2201' THEN 2 WHEN 'DHND 2202' THEN 2 WHEN 'DHND 2203' THEN 2 WHEN 'DHND 2204' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DHND 1101' THEN 1 WHEN 'DHND 1102' THEN 1 WHEN 'DHND 1103' THEN 1 WHEN 'DHND 1104' THEN 1
    WHEN 'DHND 1201' THEN 2 WHEN 'DHND 1202' THEN 2 WHEN 'DHND 1203' THEN 2 WHEN 'DHND 1204' THEN 2
    WHEN 'DHND 2101' THEN 1 WHEN 'DHND 2102' THEN 1 WHEN 'DHND 2103' THEN 1 WHEN 'DHND 2104' THEN 1
    WHEN 'DHND 2201' THEN 2 WHEN 'DHND 2202' THEN 2 WHEN 'DHND 2203' THEN 2 WHEN 'DHND 2204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-DHND' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DHND %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Diploma in Food Science & Technology (KSHS-DFSN)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DFST 1101' THEN 1 WHEN 'DFST 1102' THEN 1 WHEN 'DFST 1103' THEN 1
    WHEN 'DFST 1201' THEN 1 WHEN 'DFST 1202' THEN 1 WHEN 'DFST 1203' THEN 1
    WHEN 'DFST 2101' THEN 2 WHEN 'DFST 2102' THEN 2 WHEN 'DFST 2103' THEN 2
    WHEN 'DFST 2201' THEN 2 WHEN 'DFST 2202' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DFST 1101' THEN 1 WHEN 'DFST 1102' THEN 1 WHEN 'DFST 1103' THEN 1
    WHEN 'DFST 1201' THEN 2 WHEN 'DFST 1202' THEN 2 WHEN 'DFST 1203' THEN 2
    WHEN 'DFST 2101' THEN 1 WHEN 'DFST 2102' THEN 1 WHEN 'DFST 2103' THEN 1
    WHEN 'DFST 2201' THEN 2 WHEN 'DFST 2202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='KSHS-DFSN' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DFST %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Diploma in Diagnostic Sonography (KSHS-DDS)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DDS 1101' THEN 1 WHEN 'DDS 1102' THEN 1 WHEN 'DDS 1103' THEN 1 WHEN 'DDS 1104' THEN 1
    WHEN 'DDS 1201' THEN 1 WHEN 'DDS 1202' THEN 1 WHEN 'DDS 1203' THEN 1 WHEN 'DDS 1204' THEN 1
    WHEN 'DDS 2101' THEN 2 WHEN 'DDS 2102' THEN 2 WHEN 'DDS 2103' THEN 2 WHEN 'DDS 2104' THEN 2
    WHEN 'DDS 2201' THEN 2 WHEN 'DDS 2202' THEN 2 WHEN 'DDS 2203' THEN 2 WHEN 'DDS 2204' THEN 2
    WHEN 'DDS 3101' THEN 3 WHEN 'DDS 3102' THEN 3 WHEN 'DDS 3103' THEN 3 WHEN 'DDS 3104' THEN 3
    WHEN 'DDS 3201' THEN 3 WHEN 'DDS 3202' THEN 3 WHEN 'DDS 3203' THEN 3 WHEN 'DDS 3204' THEN 3
  END,
  CASE c.""Code""
    WHEN 'DDS 1101' THEN 1 WHEN 'DDS 1102' THEN 1 WHEN 'DDS 1103' THEN 1 WHEN 'DDS 1104' THEN 1
    WHEN 'DDS 1201' THEN 2 WHEN 'DDS 1202' THEN 2 WHEN 'DDS 1203' THEN 2 WHEN 'DDS 1204' THEN 2
    WHEN 'DDS 2101' THEN 1 WHEN 'DDS 2102' THEN 1 WHEN 'DDS 2103' THEN 1 WHEN 'DDS 2104' THEN 1
    WHEN 'DDS 2201' THEN 2 WHEN 'DDS 2202' THEN 2 WHEN 'DDS 2203' THEN 2 WHEN 'DDS 2204' THEN 2
    WHEN 'DDS 3101' THEN 1 WHEN 'DDS 3102' THEN 1 WHEN 'DDS 3103' THEN 1 WHEN 'DDS 3104' THEN 1
    WHEN 'DDS 3201' THEN 2 WHEN 'DDS 3202' THEN 2 WHEN 'DDS 3203' THEN 2 WHEN 'DDS 3204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='KSHS-DDS' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DDS %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Advanced Diploma in Diagnostic Sonography (SB-ADDS)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'ADDS 4101' THEN 1 WHEN 'ADDS 4102' THEN 1 WHEN 'ADDS 4103' THEN 1
    WHEN 'ADDS 4201' THEN 1 WHEN 'ADDS 4202' THEN 1 WHEN 'ADDS 4203' THEN 1
  END,
  CASE c.""Code""
    WHEN 'ADDS 4101' THEN 1 WHEN 'ADDS 4102' THEN 1 WHEN 'ADDS 4103' THEN 1
    WHEN 'ADDS 4201' THEN 2 WHEN 'ADDS 4202' THEN 2 WHEN 'ADDS 4203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-ADDS' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'ADDS %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Certificate in Biomedical Engineering (KSHS-CBME)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'CBME 1101' THEN 1 WHEN 'CBME 1102' THEN 1 WHEN 'CBME 1103' THEN 1 WHEN 'CBME 1104' THEN 1
    WHEN 'CBME 1201' THEN 1 WHEN 'CBME 1202' THEN 1 WHEN 'CBME 1203' THEN 1 WHEN 'CBME 1204' THEN 1
    WHEN 'CBME 2101' THEN 2 WHEN 'CBME 2102' THEN 2 WHEN 'CBME 2103' THEN 2 WHEN 'CBME 2104' THEN 2
    WHEN 'CBME 2201' THEN 2 WHEN 'CBME 2202' THEN 2 WHEN 'CBME 2203' THEN 2
  END,
  CASE c.""Code""
    WHEN 'CBME 1101' THEN 1 WHEN 'CBME 1102' THEN 1 WHEN 'CBME 1103' THEN 1 WHEN 'CBME 1104' THEN 1
    WHEN 'CBME 1201' THEN 2 WHEN 'CBME 1202' THEN 2 WHEN 'CBME 1203' THEN 2 WHEN 'CBME 1204' THEN 2
    WHEN 'CBME 2101' THEN 1 WHEN 'CBME 2102' THEN 1 WHEN 'CBME 2103' THEN 1 WHEN 'CBME 2104' THEN 1
    WHEN 'CBME 2201' THEN 2 WHEN 'CBME 2202' THEN 2 WHEN 'CBME 2203' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='KSHS-CBME' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'CBME %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Diploma in Biomedical Engineering (KSHS-DBME)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DBME 1101' THEN 1 WHEN 'DBME 1102' THEN 1 WHEN 'DBME 1103' THEN 1 WHEN 'DBME 1104' THEN 1
    WHEN 'DBME 1201' THEN 1 WHEN 'DBME 1202' THEN 1 WHEN 'DBME 1203' THEN 1 WHEN 'DBME 1204' THEN 1
    WHEN 'DBME 2101' THEN 2 WHEN 'DBME 2102' THEN 2 WHEN 'DBME 2103' THEN 2 WHEN 'DBME 2104' THEN 2
    WHEN 'DBME 2201' THEN 2 WHEN 'DBME 2202' THEN 2 WHEN 'DBME 2203' THEN 2 WHEN 'DBME 2204' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DBME 1101' THEN 1 WHEN 'DBME 1102' THEN 1 WHEN 'DBME 1103' THEN 1 WHEN 'DBME 1104' THEN 1
    WHEN 'DBME 1201' THEN 2 WHEN 'DBME 1202' THEN 2 WHEN 'DBME 1203' THEN 2 WHEN 'DBME 1204' THEN 2
    WHEN 'DBME 2101' THEN 1 WHEN 'DBME 2102' THEN 1 WHEN 'DBME 2103' THEN 1 WHEN 'DBME 2104' THEN 1
    WHEN 'DBME 2201' THEN 2 WHEN 'DBME 2202' THEN 2 WHEN 'DBME 2203' THEN 2 WHEN 'DBME 2204' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='KSHS-DBME' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DBME %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Guidance & Counselling (SB-CGC / SB-DHCG)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DHCG 1101' THEN 1 WHEN 'DHCG 1102' THEN 1 WHEN 'DHCG 1103' THEN 1
    WHEN 'DHCG 1201' THEN 1 WHEN 'DHCG 1202' THEN 1 WHEN 'DHCG 1203' THEN 1
    WHEN 'DHCG 2101' THEN 2 WHEN 'DHCG 2102' THEN 2 WHEN 'DHCG 2103' THEN 2
    WHEN 'DHCG 2201' THEN 2 WHEN 'DHCG 2202' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DHCG 1101' THEN 1 WHEN 'DHCG 1102' THEN 1 WHEN 'DHCG 1103' THEN 1
    WHEN 'DHCG 1201' THEN 2 WHEN 'DHCG 1202' THEN 2 WHEN 'DHCG 1203' THEN 2
    WHEN 'DHCG 2101' THEN 1 WHEN 'DHCG 2102' THEN 1 WHEN 'DHCG 2103' THEN 1
    WHEN 'DHCG 2201' THEN 2 WHEN 'DHCG 2202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-CGC' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DHCG %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Records Management (SB-CRM-C / SB-DRM)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DRM 1101' THEN 1 WHEN 'DRM 1102' THEN 1
    WHEN 'DRM 1201' THEN 1 WHEN 'DRM 1202' THEN 1
    WHEN 'DRM 2101' THEN 2 WHEN 'DRM 2102' THEN 2
    WHEN 'DRM 2201' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DRM 1101' THEN 1 WHEN 'DRM 1102' THEN 1
    WHEN 'DRM 1201' THEN 2 WHEN 'DRM 1202' THEN 2
    WHEN 'DRM 2101' THEN 1 WHEN 'DRM 2102' THEN 1
    WHEN 'DRM 2201' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-CRM-C' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DRM %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Secretarial Studies & Office Management (KSHS-CSSOM / KSHS-DSSOM)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'DSSOM 1101' THEN 1 WHEN 'DSSOM 1102' THEN 1
    WHEN 'DSSOM 1201' THEN 1 WHEN 'DSSOM 1202' THEN 1
    WHEN 'DSSOM 2101' THEN 2 WHEN 'DSSOM 2102' THEN 2
    WHEN 'DSSOM 2201' THEN 2
  END,
  CASE c.""Code""
    WHEN 'DSSOM 1101' THEN 1 WHEN 'DSSOM 1102' THEN 1
    WHEN 'DSSOM 1201' THEN 2 WHEN 'DSSOM 1202' THEN 2
    WHEN 'DSSOM 2101' THEN 1 WHEN 'DSSOM 2102' THEN 1
    WHEN 'DSSOM 2201' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='KSHS-CSSOM' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'DSSOM %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Advanced Diploma in Health Promotion & Education (SB-ADHPE)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'ADHPE 1101' THEN 1
    WHEN 'ADHPE 1201' THEN 1
    WHEN 'ADHPE 2101' THEN 2
    WHEN 'ADHPE 2201' THEN 2
  END,
  CASE c.""Code""
    WHEN 'ADHPE 1101' THEN 1
    WHEN 'ADHPE 1201' THEN 2
    WHEN 'ADHPE 2101' THEN 1
    WHEN 'ADHPE 2201' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-ADHPE' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'ADHPE %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");

-- SCHOOL_BASED - Bridging Programme (SB-BRIDGE)
INSERT INTO ""CurriculumCourses"" (""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
  CASE c.""Code""
    WHEN 'BRDG 1101' THEN 1 WHEN 'BRDG 1102' THEN 1
    WHEN 'BRDG 1201' THEN 1 WHEN 'BRDG 1202' THEN 1
  END,
  CASE c.""Code""
    WHEN 'BRDG 1101' THEN 1 WHEN 'BRDG 1102' THEN 1
    WHEN 'BRDG 1201' THEN 2 WHEN 'BRDG 1202' THEN 2
  END,
  TRUE
FROM ""Curricula"" cu
JOIN ""Programmes"" p ON cu.""ProgrammeId""=p.""Id"" AND p.""Code""='SB-BRIDGE' AND p.""Regulator""='SCHOOL_BASED'
JOIN ""Courses"" c ON c.""AuthorityCode""='SCHOOL_BASED'
WHERE cu.""Version""='KSHS-CATALOG-2026-11'
  AND c.""Code"" LIKE 'BRDG %'
  AND NOT EXISTS (SELECT 1 FROM ""CurriculumCourses"" cc WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id"");
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Retain curricula and mappings on rollback.
    }
}
