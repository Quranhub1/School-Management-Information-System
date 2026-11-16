using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261117110000_SeedProvisionalUhpabCurriculum")]
public partial class SeedProvisionalUhpabCurriculum : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Course units below are transcribed from the signed UHPAB December 2025 assessment
        // timetable. The paper-code prefix identifies the programme; the first two digits
        // of the numeric suffix are used as provisional year/semester positions. This is a
        // navigation aid, not a substitute for the approved curriculum document.
        migrationBuilder.Sql(@"
WITH source_courses(""Code"", ""Name"") AS (
    VALUES
    ('DNE 211','Pediatric Nursing III'),
    ('DNE 212','Gynecology II and Reproductive Health II'),
    ('DMD 321','Midwifery IV'),
    ('DMD 322','Pediatric Nursing II'),
    ('DME 211','Midwifery III'),
    ('DCNE 211','Midwifery III and Pediatric Nursing III'),
    ('DCNE 212','Medical Nursing IV and Palliative Care Nursing'),
    ('DMHNE 211','Community Mental Health Nursing'),
    ('DMHNE 212','Palliative Care Nursing, Occupational Health and Safety'),
    ('DPCHN 211','Palliative Care, Guidance and Counseling'),
    ('DPCHN 212','Intensive Care and Special Care in Pediatric Nursing'),
    ('ADPHN 121','Reproductive Health and Palliative Care Nursing'),
    ('ADPHN 122','Disaster Preparedness and Management, Gender and Community Development'),
    ('CN 311','Tropical Medicine and Surgical Nursing III'),
    ('CN 312','Reproductive Health, Guidance and Counseling'),
    ('CMHN 311','Psychiatric Nursing V and Community Mental Health Nursing'),
    ('CMHN 312','Child Psychiatry and Occupational Health and Safety'),
    ('CM 311','Gynecology and Reproductive Health'),
    ('CM 312','Mental Health Nursing, Guidance and Counseling'),
    ('CCN 311','Midwifery II and Reproductive Health'),
    ('CCN 312','Paediatric Nursing and Community Health Nursing'),
    ('CEC 1101','Emergency Care Services, Occupational Health and Safety'),
    ('CEC 1102','Communication and Counseling Skills'),
    ('CEC 2201','Medical Emergency Care II'),
    ('CEH 2101','Community Health'),
    ('CEH 2102','Sanitary Building and Construction'),
    ('CEH 1101','Communicable Diseases'),
    ('CEH 1102','Human Waste Management'),
    ('CLT 1101','General Laboratory Practice I'),
    ('CLT 1102','Parasitology I'),
    ('CMR 1101','Introduction to Health Care System'),
    ('CMR 1102','Essentials of Biomedical and Clinical Terminology'),
    ('CPH 1101','Human Anatomy and Physiology I'),
    ('CTA 2201','Theatre Techniques II'),
    ('DAN 1103','Applied Anatomy and Physiology I'),
    ('ORD 2202','Otology'),
    ('ORD 2203','Rhinology I'),
    ('ENTO 3101','Laboratory Techniques III'),
    ('ENTO 3102','Arthropoda IV'),
    ('OPM 1202','Applied Anatomy I'),
    ('OPM 1203','Applied Physiology'),
    ('OTD 1201','Applied Anatomy'),
    ('OTD 1202','Lower Limb Orthotics'),
    ('OTD 2101','Applied Anatomy II'),
    ('OPM 2102','Applied Anatomy II'),
    ('DCM 1101','Introduction to Anatomy and Physiology and Systemic Anatomy and Physiology'),
    ('DCM 1102','Medical Psychology'),
    ('DCM 3101','Medicine - Infectious Conditions'),
    ('DCM 3102','Paediatrics - Neonatal Health'),
    ('DCN 1201','Applied Anatomy'),
    ('DCN 1202','Physiology'),
    ('DPT 1101','Fundamentals of Human Anatomy and Upper Limb'),
    ('DPT 1102','Fundamentals of Human Physiology'),
    ('DCN 2101','Biochemistry'),
    ('DCN 2102','Microbiology and Food Hygiene'),
    ('DCN 3101','Nutrition and Immunology'),
    ('DCN 3102','Nutrition in Emergency'),
    ('DCO 1101','Anatomy and Physiology of the Human Body'),
    ('DCO 1102','Medical Microbiology'),
    ('DCO 3101','Clinical Ophthalmology'),
    ('HCO 1104','Clinical Ophthalmology'),
    ('MLT 1101','General Laboratory Practice I'),
    ('DMR 2201','Anatomy IV'),
    ('DCP 1101','Anatomy and Physiology'),
    ('DPT 2202','High Frequency Currents (Electrotherapy)'),
    ('DDT 3101','Crown and Bridge I'),
    ('DDT 3102','Dental Materials II'),
    ('DLM 1101','Concepts, Principles and Theories in Leadership and Management'),
    ('DLM 1102','Practices in Leadership and Management'),
    ('DEH 1101','Principles of Communicable Disease Control'),
    ('DEH 1102','Vector and Vermin Control'),
    ('DHP 1103','Anatomy and Physiology'),
    ('DHP 1104','Fundamentals of Health Promotion I'),
    ('HPE 1101','Theory and Practices of Health Promotion and Education'),
    ('HPE 1103','Behavior, Life Skills and Health'),
    ('HPE 1202','Human Communication and Media Technology'),
    ('DMR 3101','Radiographic Equipment I'),
    ('DMR 3102','Radiographic Photography I'),
    ('DOT 3101','Occupational Therapy Physical Dysfunction'),
    ('DOT 3102','Orthotics and Assistive Aids'),
    ('DPT 2101','Anatomy of the Head, Thorax and Abdomen'),
    ('DPT 2102','Introduction to Exercise Therapy'),
    ('DPT 3101','Obstetrics and Gynaecology'),
    ('DPT 3102','Neurology'),
    ('MER 1101','Introduction to Health Care Systems'),
    ('MER 1104','Basic Anatomy and Physiology I'),
    ('MER 1102','Customer Care and Communication Skills'),
    ('OPM 3101','Surgery I'),
    ('OPM 3102','Principles of Rehabilitation'),
    ('ORD 1101','Anatomy and Physiology'),
    ('ORD 1102','General Nursing'),
    ('DOR 1101','ENT Nursing and Medical Ethics'),
    ('DOR 1103','Rhinology I'),
    ('PHA 1101','Anatomy and Physiology I'),
    ('PHA 1102','Medical Microbiology and Parasitology I'),
    ('PHD 3101','Operative Dentistry III'),
    ('PHD 3102','Oral Surgery and Pathology III'),
    ('ADPCN 111','Foundations of Palliative Care, Communication and Counselling in Palliative Care'),
    ('ADPCN 112','Ethics and Legal Issues in Palliative Care, Psychosocial Issues and Teamwork'),
    ('ORD 1201','Anatomy and Physiology II'),
    ('ORD 1202','Nutrition and Biochemistry'),
    ('DND 121','Anatomy and Physiology II'),
    ('DND 122','Foundations of Nursing II'),
    ('DMD 121','Anatomy and Physiology II'),
    ('DMD 122','Foundations of Nursing II'),
    ('DMHND 121','Anatomy and Physiology II'),
    ('DMHND 122','Foundations of Nursing II'),
    ('DCND 121','Anatomy and Physiology II'),
    ('DCND 122','Foundations of Nursing II and Microbiology II'),
    ('DNE 121','Primary Health Care and Community Based Health Care'),
    ('DNE 122','Applied Research and Teaching Methodology'),
    ('DND 311','Primary Health Care and Community Based Health Care'),
    ('DND 312','Applied Research and Teaching Methodology'),
    ('DME 121','Midwifery II'),
    ('DME 122','Applied Research and Teaching Methodology'),
    ('DMD 311','Midwifery III'),
    ('DMD 312','Applied Research and Teaching Methodology'),
    ('DMHNE 121','Occupational Therapy and Mental Health Rehabilitation'),
    ('DMHNE 122','Applied Research and Teaching Methodology'),
    ('DMHND 311','Occupational Therapy and Mental Health Rehabilitation'),
    ('DMHND 312','Applied Research and Teaching Methodology'),
    ('DPCHN 121','Pediatric Medical Nursing and Pediatric Psychiatry'),
    ('DPCHN 122','Applied Research and Teaching Methodology'),
    ('ADPHN 111','Biostatistics, Demographic Studies and Epidemiology'),
    ('ADPHN 112','Applied Research and Teaching Methodology'),
    ('CN 121','Anatomy and Physiology II'),
    ('CN 122','Foundations of Nursing II, Sociology and Psychology'),
    ('CM 121','Anatomy and Physiology II'),
    ('CM 122','Foundations of Nursing II, Sociology and Psychology'),
    ('CCN 122','Foundations of Nursing II and Surgical Nursing I'),
    ('CMHN 122','Foundations of Nursing II, Psychology II and Psychiatric Nursing II'),
    ('MER 3102','Health Information Management'),
    ('DCP 2206','Psychiatry II'),
    ('DCP 1201','Internal Medicine'),
    ('HDP 1201','Psychiatry II'),
    ('HDP 1202','Internal Medicine'),
    ('CTA 1201','Anatomy and Physiology II'),
    ('HDP 2101','Liaison Psychiatry (Psychiatry III)'),
    ('DCP 2102','Liaison Psychiatry (Psychiatry III)'),
    ('DPT 2103','Therapeutic Massage (Theory)'),
    ('DPT 2104','Medium Frequency Currents and Cryotherapy (Theory)'),
    ('DCN 1103','First Aid and Nursing Theory'),
    ('DCN 2202','Food Security'),
    ('OTD 2205','Technical Drawing II (Theory)'),
    ('DCN 2103','Nutrition Assessment'),
    ('DCN 2104','Maternal and Child Health Nutrition'),
    ('DCN 1203','Fundamentals of Food and Nutrition'),
    ('MER 3104','Medical Records Management System'),
    ('MER 3105','Health Management Information System II'),
    ('OTD 2103','Lower Limb Prosthetics'),
    ('OTD 2105','Material Science'),
    ('DOT 3103','Advanced Studies in Occupational Therapy'),
    ('OPM 3103','Community Health'),
    ('OPM 3104','Social Psychology, Guidance and Counselling and Palliative Care'),
    ('MER 1103','Medical Records Ethics and Professionalism'),
    ('DPT 3103','Disability and Rehabilitation'),
    ('DPT 2203','Orthopedics'),
    ('DPT 2204','Applied Exercise Therapy II'),
    ('DDT 3103','Dental Materials IV'),
    ('DDT 3104','Orthodontics III'),
    ('DEH 1103','Human Waste Management'),
    ('DLM 1103','Leadership and Management Practices in Health Services'),
    ('HPE 1105','Primary Health Care'),
    ('HPE 1104','Community and Environmental Health'),
    ('ENTO 3103','Epidemiology and Community Health'),
    ('ENTO 3104','Parasitology III'),
    ('DCP 3105','Community Health and Primary Health Care'),
    ('HDP 1104','Community Health I'),
    ('DCP 3101','Community Mental Health'),
    ('CEH 2103','Food and Nutrition'),
    ('CEH 2104','Public Health Legislation and Administration'),
    ('DND 313','Palliative Care Nursing'),
    ('DND 314','Disaster Management, Occupational Health and Safety'),
    ('DNE 123','Palliative Care Nursing'),
    ('DNE 124','Disaster Management, Occupational Health and Safety'),
    ('DMeL 213','Palliative Care Nursing'),
    ('DMeL 214','Disaster Management, Occupational Health and Safety'),
    ('DMD 313','Palliative Care Nursing'),
    ('DMD 314','Disaster Management, Occupational Health and Safety'),
    ('DME 123','Paediatric Nursing I and Palliative Care Nursing'),
    ('DME 124','Disaster Management, Occupational Health and Safety'),
    ('DMHNE 123','Primary Health Care'),
    ('DMHNE 124','Health Services Management I'),
    ('DMHND 313','Primary Health Care'),
    ('DMHND 314','Health Services Management I'),
    ('DPCHN 123','Paediatric Surgical Nursing and Paediatric HIV/AIDS'),
    ('DPCHN 124','Environmental Health and Epidemiology'),
    ('DCNE 123','Medical Nursing III and Mental Health Nursing IV'),
    ('DCNE 124','Surgical Nursing III, Health Service Management II and Entrepreneurship'),
    ('DCND 313','Medical Nursing III and Mental Health Nursing IV'),
    ('DCND 314','Surgical Nursing III, Health Service Management II and Entrepreneurship'),
    ('ADPHN 113','Primary Health Care'),
    ('ADPHN 114','Public Health Nursing Practices, Occupational Health and Safety'),
    ('CN 123','Primary Health Care'),
    ('CN 211','Medical Nursing I and Pharmacology I'),
    ('CM 123','Primary Health Care'),
    ('CM 211','Obstetrical Anatomy'),
    ('CCN 123','Medical Nursing I and Pharmacology II'),
    ('CCN 211','Medical Nursing II and Mental Health Nursing'),
    ('CMHN 123','Medical-Surgical Nursing I and Pharmacology I'),
    ('CMHN 211','Psychiatric Nursing III and Pharmacology II'),
    ('DCM 1103','Nursing Practice')
)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",0,
       'Imported from UHPAB December 2025 assessment timetable; provisional curriculum placement.',
       'Provisional timetable paper',TRUE
FROM source_courses s
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- Create a clearly labelled draft curriculum for each UHPAB programme represented by
-- course papers in the timetable. It is not marked approved.
INSERT INTO ""Curricula""
(""Id"",""ProgrammeId"",""Version"",""Title"",""MinimumCredits"",""EffectiveFrom"",""EffectiveTo"",""ProgrammeType"",""Status"",""IsActive"")
SELECT gen_random_uuid(),p.""Id"",'UHPAB-DEC-2025-PROVISIONAL',
       'Provisional timetable-derived curriculum — verify against approved UHPAB curriculum',
       0,DATE '2025-12-01',NULL,0,'Draft',TRUE
FROM ""Programmes"" p
WHERE p.""Regulator""='UHPAB' AND p.""IsReferenceOnly""=FALSE
  AND EXISTS (
    SELECT 1 FROM ""Courses"" c
    WHERE c.""AuthorityCode""='UHPAB'
      AND upper(split_part(c.""Code"",' ',1))=upper(p.""Code"")
  )
  AND NOT EXISTS (
    SELECT 1 FROM ""Curricula"" cu
    WHERE cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='UHPAB-DEC-2025-PROVISIONAL'
  );

-- The numeric suffix convention is used only to suggest year/semester:
-- 1101 => Year 1, Semester 1; 2201 => Year 2, Semester 2; 311 => Year 3, Semester 1.
-- Every mapping remains in a Draft curriculum pending verification.
INSERT INTO ""CurriculumCourses""
(""Id"",""CurriculumId"",""CourseId"",""YearOfStudy"",""SemesterNumber"",""IsCore"")
SELECT gen_random_uuid(),cu.""Id"",c.""Id"",
       substring(regexp_replace(c.""Code"",'^[^ ]+\s*','') from 1 for 1)::integer,
       substring(regexp_replace(c.""Code"",'^[^ ]+\s*','') from 2 for 1)::integer,
       TRUE
FROM ""Courses"" c
JOIN ""Programmes"" p ON upper(p.""Code"")=upper(split_part(c.""Code"",' ',1)) AND p.""Regulator""='UHPAB'
JOIN ""Curricula"" cu ON cu.""ProgrammeId""=p.""Id"" AND cu.""Version""='UHPAB-DEC-2025-PROVISIONAL'
WHERE c.""AuthorityCode""='UHPAB'
  AND length(regexp_replace(c.""Code"",'^[^ ]+\s*','')) >= 3
  AND substring(regexp_replace(c.""Code"",'^[^ ]+\s*','') from 1 for 1) ~ '^[1-9]$'
  AND substring(regexp_replace(c.""Code"",'^[^ ]+\s*','') from 2 for 1) ~ '^[1-9]$'
  AND NOT EXISTS (
    SELECT 1 FROM ""CurriculumCourses"" cc
    WHERE cc.""CurriculumId""=cu.""Id"" AND cc.""CourseId""=c.""Id""
  );
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Keep imported courses and draft mappings on rollback so later student/curriculum
        // references are not deleted. The records are explicitly marked provisional.
    }
}
