using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261122120000_SeedCurriculumCoursesFromCatalog")]
public partial class SeedCurriculumCoursesFromCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- ============================================================================
-- Course Unit Catalogue seeded from KSHS Master Curriculum & Course Units Catalog
-- (26-page PDF, extracted and integrated 2026-11-22)
-- AuthorityCode indicates the owning regulatory body: UHPAB or SCHOOL_BASED
-- ============================================================================

-- UHPAB courses - Certificate in Nursing (CN)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Nursing (CN), 5 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CNUR 1101','Anatomy and Physiology I',4.0,'Theory'),
    ('CNUR 1102','Fundamentals of Nursing I',5.0,'Theory + Practical'),
    ('CNUR 1103','Microbiology and Parasitology',3.0,'Theory'),
    ('CNUR 1104','First Aid and Emergency Nursing',3.0,'Theory + Practical'),
    ('CNUR 1105','Communication Skills and Psychology',3.0,'Theory'),
    ('CNUR 1106','Computer Applications in Health',2.0,'Practical'),
    ('CNUR 1201','Anatomy and Physiology II',4.0,'Theory'),
    ('CNUR 1202','Fundamentals of Nursing II',5.0,'Theory + Practical'),
    ('CNUR 1203','Basic Pharmacology',4.0,'Theory'),
    ('CNUR 1204','Primary Health Care (PHC)',3.0,'Theory'),
    ('CNUR 1205','Nutrition and Dietetics in Nursing',2.0,'Theory'),
    ('CNUR 1206','Clinical Nursing Practicum I',4.0,'Clinical'),
    ('CNUR 2101','Medical Nursing I',5.0,'Theory'),
    ('CNUR 2102','Surgical Nursing I',5.0,'Theory'),
    ('CNUR 2103','Paediatric Nursing I',4.0,'Theory'),
    ('CNUR 2104','Reproductive Health and Obstetric Nursing',3.0,'Theory'),
    ('CNUR 2105','Clinical Nursing Practicum II',5.0,'Clinical'),
    ('CNUR 2201','Medical Nursing II',5.0,'Theory'),
    ('CNUR 2202','Surgical Nursing II and Theatre Technique',5.0,'Theory'),
    ('CNUR 2203','Paediatric Nursing II',4.0,'Theory'),
    ('CNUR 2204','Mental Health and Psychiatric Nursing',3.0,'Theory'),
    ('CNUR 2205','Clinical Nursing Practicum III',5.0,'Clinical'),
    ('CNUR 3101','Community Health Nursing and Epidemiology',4.0,'Theory + Field'),
    ('CNUR 3102','Ward Management, Ethics and Entrepreneurship',3.0,'Theory'),
    ('CNUR 3103','Integrated Clinical Nursing Practicum IV',8.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Midwifery (CM)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Midwifery (CM), 5 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CMID 1101','Anatomy and Physiology I (General and Pelvis)',4.0,'Theory'),
    ('CMID 1102','Fundamentals of Nursing and Midwifery I',5.0,'Theory + Practical'),
    ('CMID 1103','Microbiology, Parasitology and Infection Control',3.0,'Theory'),
    ('CMID 1104','First Aid, Communication and Psychology',4.0,'Theory'),
    ('CMID 1105','Computer Applications',2.0,'Practical'),
    ('CMID 1201','Anatomy and Physiology II (Reproductive and Foetal)',4.0,'Theory'),
    ('CMID 1202','Normal Pregnancy and Antenatal Care',5.0,'Theory + Practical'),
    ('CMID 1203','Pharmacology in Midwifery',3.0,'Theory'),
    ('CMID 1204','Primary Health Care and Maternal Nutrition',3.0,'Theory'),
    ('CMID 1205','Clinical Midwifery Practicum I (Antenatal)',5.0,'Clinical'),
    ('CMID 2101','Normal Labour, Delivery and Puerperium',5.0,'Theory + Practical'),
    ('CMID 2102','Neonatology and Essential Newborn Care',4.0,'Theory'),
    ('CMID 2103','Complicated Pregnancy (Abnormal Antenatal)',4.0,'Theory'),
    ('CMID 2104','Clinical Midwifery Practicum II (Labour and Postnatal)',6.0,'Clinical'),
    ('CMID 2201','Complicated Labour, Delivery and Obstetric Emergencies',5.0,'Theory'),
    ('CMID 2202','Abnormal Puerperium and Sick Newborn Care',4.0,'Theory'),
    ('CMID 2203','Gynaecological Nursing and Family Planning',4.0,'Theory'),
    ('CMID 2204','Clinical Midwifery Practicum III (Emergency Obstetric)',6.0,'Clinical'),
    ('CMID 3101','Community Midwifery and Domiciliary Care',4.0,'Theory + Field'),
    ('CMID 3102','Maternity Unit Management, Ethics and Entrepreneurship',3.0,'Theory'),
    ('CMID 3103','Integrated Midwifery Practicum IV',8.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Nursing (DN/DND)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Nursing (DN/DND), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DNUR 1101','Human Anatomy and Physiology I',4.0,'Theory'),
    ('DNUR 1102','Foundations of Professional Nursing I',4.0,'Theory + Practical'),
    ('DNUR 1103','Medical Microbiology, Immunology and Parasitology',3.0,'Theory'),
    ('DNUR 1104','Behavioural Sciences (Psychology and Sociology)',3.0,'Theory'),
    ('DNUR 1105','Communication Skills and Information Technology',3.0,'Theory + Practical'),
    ('DNUR 1201','Human Anatomy and Physiology II',4.0,'Theory'),
    ('DNUR 1202','Foundations of Professional Nursing II and Health Assessment',4.0,'Theory + Practical'),
    ('DNUR 1203','Clinical Pharmacology I',3.0,'Theory'),
    ('DNUR 1204','Primary Health Care and Applied Nutrition',3.0,'Theory'),
    ('DNUR 1205','Clinical Nursing Placement I',4.0,'Clinical'),
    ('DNUR 2101','Adult Medical Nursing I',4.0,'Theory'),
    ('DNUR 2102','Adult Surgical Nursing I',4.0,'Theory'),
    ('DNUR 2103','Clinical Pharmacology II',3.0,'Theory'),
    ('DNUR 2104','Paediatric and Child Health Nursing I',4.0,'Theory'),
    ('DNUR 2105','Clinical Nursing Placement II',5.0,'Clinical'),
    ('DNUR 2201','Adult Medical Nursing II',4.0,'Theory'),
    ('DNUR 2202','Adult Surgical Nursing II and Perioperative Nursing',4.0,'Theory'),
    ('DNUR 2203','Paediatric and Child Health Nursing II',3.0,'Theory'),
    ('DNUR 2204','Sexual and Reproductive Health Nursing',4.0,'Theory'),
    ('DNUR 2205','Clinical Nursing Placement III',5.0,'Clinical'),
    ('DNUR 3101','Mental Health and Psychiatric Nursing',4.0,'Theory'),
    ('DNUR 3102','Community Health Nursing, Epidemiology and Biostatistics',4.0,'Theory'),
    ('DNUR 3103','Nursing Research Methodology',3.0,'Theory'),
    ('DNUR 3104','Critical Care, Emergency and Palliative Nursing',3.0,'Theory'),
    ('DNUR 3105','Clinical Nursing Placement IV (Psychiatry and Community)',5.0,'Clinical'),
    ('DNUR 3201','Health Services Management, Leadership and Ethics',4.0,'Theory'),
    ('DNUR 3202','Entrepreneurship and Health Economics',3.0,'Theory'),
    ('DNUR 3203','Nursing Research Dissertation',4.0,'Project'),
    ('DNUR 3204','Senior Clinical Internship / Practicum V',6.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Midwifery (DM/DMD)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Midwifery (DM/DMD), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DMID 1101','Human Anatomy and Physiology I',4.0,'Theory'),
    ('DMID 1102','Foundations of Nursing and Midwifery Practice',4.0,'Theory + Practical'),
    ('DMID 1103','Medical Microbiology and Infection Prevention',3.0,'Theory'),
    ('DMID 1104','Psychology, Sociology and Communication Skills',3.0,'Theory'),
    ('DMID 1105','Health Informatics and Computer Applications',2.0,'Practical'),
    ('DMID 1201','Reproductive Anatomy, Embryology and Foetal Physiology',4.0,'Theory'),
    ('DMID 1202','Antenatal Care and Normal Pregnancy Management',4.0,'Theory + Practical'),
    ('DMID 1203','Obstetric and General Pharmacology',3.0,'Theory'),
    ('DMID 1204','Primary Health Care and Maternal-Infant Nutrition',3.0,'Theory'),
    ('DMID 1205','Clinical Midwifery Placement I',4.0,'Clinical'),
    ('DMID 2101','Intrapartum Care: Normal Labour and Delivery',4.0,'Theory + Practical'),
    ('DMID 2102','Postpartum Care and Normal Puerperium',4.0,'Theory'),
    ('DMID 2103','Neonatology and Essential Newborn Care',4.0,'Theory'),
    ('DMID 2104','Medical and Surgical Conditions in Pregnancy',3.0,'Theory'),
    ('DMID 2105','Clinical Midwifery Placement II',5.0,'Clinical'),
    ('DMID 2201','High-Risk Pregnancy and Abnormal Antenatal Care',4.0,'Theory'),
    ('DMID 2202','Complicated Labour and Obstetric Emergencies (EmONC)',5.0,'Theory + Practical'),
    ('DMID 2203','High-Risk Neonate and Sick Newborn Management',4.0,'Theory'),
    ('DMID 2204','Clinical Midwifery Placement III',5.0,'Clinical'),
    ('DMID 3101','Gynaecology, Sexual and Reproductive Health',4.0,'Theory'),
    ('DMID 3102','Community Midwifery, Epidemiology and Biostatistics',4.0,'Theory + Field'),
    ('DMID 3103','Midwifery Research Methodology',3.0,'Theory'),
    ('DMID 3104','Clinical Midwifery Placement IV (Gynae and Community)',5.0,'Clinical'),
    ('DMID 3201','Maternity Services Management, Ethics and Law',4.0,'Theory'),
    ('DMID 3202','Entrepreneurship in Reproductive Health',3.0,'Theory'),
    ('DMID 3203','Midwifery Research Dissertation',4.0,'Project'),
    ('DMID 3204','Senior Midwifery Clinical Practicum V',6.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Clinical Medicine & Community Health (DCM)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Clinical Medicine and Community Health (DCM), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DCM 1101','Human Anatomy I',4.0,'Theory + Practical'),
    ('DCM 1102','Human Physiology I',4.0,'Theory + Practical'),
    ('DCM 1103','Medical Biochemistry',3.0,'Theory'),
    ('DCM 1104','Medical Microbiology and Immunology',4.0,'Theory + Practical'),
    ('DCM 1105','First Aid, Nursing Care and Communication Skills',3.0,'Theory + Practical'),
    ('DCM 1106','Computer Applications in Medicine',2.0,'Practical'),
    ('DCM 1201','Human Anatomy II',4.0,'Theory + Practical'),
    ('DCM 1202','Human Physiology II',4.0,'Theory + Practical'),
    ('DCM 1203','General Pathology and Parasitology',4.0,'Theory + Practical'),
    ('DCM 1204','Basic Pharmacology',4.0,'Theory'),
    ('DCM 1205','Primary Health Care and Medical Psychology',3.0,'Theory'),
    ('DCM 1206','Introductory Clinical Skills and Clerkship',3.0,'Clinical'),
    ('DCM 2101','Internal Medicine I',4.0,'Theory'),
    ('DCM 2102','General Surgery I',4.0,'Theory'),
    ('DCM 2103','Paediatrics and Child Health I',4.0,'Theory'),
    ('DCM 2104','Clinical Pharmacology and Therapeutics I',3.0,'Theory'),
    ('DCM 2105','Clinical Rotations I (Medicine and Surgery)',5.0,'Clinical'),
    ('DCM 2201','Internal Medicine II',4.0,'Theory'),
    ('DCM 2202','General Surgery II and Anaesthesia',4.0,'Theory'),
    ('DCM 2203','Obstetrics and Gynaecology I',4.0,'Theory'),
    ('DCM 2204','Clinical Pharmacology and Therapeutics II',3.0,'Theory'),
    ('DCM 2205','Clinical Rotations II (Paediatrics and Obs/Gyn)',5.0,'Clinical'),
    ('DCM 3101','Obstetrics and Gynaecology II',4.0,'Theory'),
    ('DCM 3102','Paediatrics and Child Health II',3.0,'Theory'),
    ('DCM 3103','Specialties (ENT, Ophthalmology, Psychiatry and Dermatology)',4.0,'Theory'),
    ('DCM 3104','Epidemiology, Biostatistics and Research Methods',4.0,'Theory'),
    ('DCM 3105','Community Health Field Attachment (COBES)',4.0,'Field'),
    ('DCM 3201','Health Services Management, Ethics and Medical Law',3.0,'Theory'),
    ('DCM 3202','Entrepreneurship and Disaster Preparedness',3.0,'Theory'),
    ('DCM 3203','Clinical Research Dissertation',4.0,'Project'),
    ('DCM 3204','Senior Clinical Clerkship / Rotations III',8.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Pharmacy (CPH)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Pharmacy (CPH), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CPHA 1101','Human Anatomy and Physiology I',3.0,'Theory'),
    ('CPHA 1102','First Aid',5.0,'Theory + Practical'),
    ('CPHA 1103','Computer Applications',5.0,'Practical'),
    ('CPHA 1104','Microbiology and Parasitology',3.0,'Theory'),
    ('CPHA 1105','Pharmaceutical Chemistry I',4.0,'Theory + Practical'),
    ('CPHA 1106','Primary Health Care',3.0,'Theory'),
    ('CPHA 1201','Human Anatomy and Physiology II',3.0,'Theory'),
    ('CPHA 1202','Basic Pharmacognosy',3.0,'Theory + Practical'),
    ('CPHA 1203','Communication Skills',2.0,'Theory'),
    ('CPHA 1204','Medical Psychology',3.0,'Theory'),
    ('CPHA 1205','Pharmaceutical Chemistry II',3.0,'Theory + Practical'),
    ('CPHA 1206','Pharmaceutical Calculations',3.0,'Theory'),
    ('CPHA 2101','Pharmaceutics I',4.0,'Theory + Practical'),
    ('CPHA 2102','Pharmacy Laws and Regulations',2.0,'Theory'),
    ('CPHA 2103','Pharmacy Practice I',3.0,'Theory + Practical'),
    ('CPHA 2104','Therapeutics I',3.0,'Theory'),
    ('CPHA 2105','Basic Pharmacology',3.0,'Theory'),
    ('CPHA 2107','Stores and Inventory Management',3.0,'Theory'),
    ('CPHA 2106','Field Attachment I',4.0,'Field'),
    ('CPHA 2201','Pharmaceutics II',4.0,'Theory + Practical'),
    ('CPHA 2202','Quality Assurance of Pharmaceuticals',3.0,'Theory'),
    ('CPHA 2203','Pharmacy Practice II',4.0,'Theory + Practical'),
    ('CPHA 2204','Therapeutics II',3.0,'Theory'),
    ('CPHA 2205','Entrepreneurship',4.0,'Theory'),
    ('CPHA 2206','Field Attachment II',5.0,'Field')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Pharmacy (PHA)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Pharmacy (PHA), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DPHA 1101','Human Anatomy and Physiology I',4.0,'Theory'),
    ('DPHA 1102','Physical and Inorganic Pharmaceutical Chemistry',4.0,'Theory + Practical'),
    ('DPHA 1103','Pharmaceutical Calculations and Dispensing I',4.0,'Theory + Practical'),
    ('DPHA 1104','Pharmaceutical Microbiology and Parasitology',3.0,'Theory + Practical'),
    ('DPHA 1105','Communication Skills, First Aid and Computer Apps',3.0,'Theory + Practical'),
    ('DPHA 1201','Human Anatomy and Physiology II and Biochemistry',4.0,'Theory'),
    ('DPHA 1202','Organic Pharmaceutical Chemistry',4.0,'Theory + Practical'),
    ('DPHA 1203','Pharmaceutics I (Dosage Forms)',4.0,'Theory + Practical'),
    ('DPHA 1204','Pharmacognosy I',3.0,'Theory + Practical'),
    ('DPHA 1205','Primary Health Care and Medical Psychology',3.0,'Theory'),
    ('DPHA 2101','Pharmacology I (Autonomic and CVS)',4.0,'Theory'),
    ('DPHA 2102','Pharmaceutics II (Sterile and Parenteral Products)',4.0,'Theory + Practical'),
    ('DPHA 2103','Medicinal Chemistry I',3.0,'Theory'),
    ('DPHA 2104','Pharmacognosy II and Herbal Medicine',3.0,'Theory'),
    ('DPHA 2105','Hospital and Community Pharmacy Placement I',4.0,'Field'),
    ('DPHA 2201','Pharmacology II (CNS, Endocrine and Chemotherapy)',4.0,'Theory'),
    ('DPHA 2202','Pharmaceutical Analysis and Quality Control',4.0,'Theory + Practical'),
    ('DPHA 2203','Medicinal Chemistry II',3.0,'Theory'),
    ('DPHA 2204','Clinical Pharmacy and Therapeutics I',4.0,'Theory'),
    ('DPHA 2205','Pharmacy Practice and Dispensing II',3.0,'Practical'),
    ('DPHA 3101','Clinical Pharmacy and Therapeutics II',4.0,'Theory'),
    ('DPHA 3102','Pharmaceutical Supply Chain and Inventory Management',4.0,'Theory'),
    ('DPHA 3103','Pharmacy Law, Ethics and Regulatory Affairs (NDA)',3.0,'Theory'),
    ('DPHA 3104','Biostatistics and Pharmacy Research Methodology',3.0,'Theory'),
    ('DPHA 3105','Industrial and Hospital Pharmacy Placement II',4.0,'Field'),
    ('DPHA 3201','Pharmaceutical Management and Entrepreneurship',4.0,'Theory'),
    ('DPHA 3202','Pharmacovigilance and Rational Drug Use',3.0,'Theory'),
    ('DPHA 3203','Pharmacy Research Project / Dissertation',4.0,'Project'),
    ('DPHA 3204','Comprehensive Pharmacy Internship III',6.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Medical Laboratory Techniques (CLT)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Medical Laboratory Techniques (CLT), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CMLT 1101','Laboratory Safety, Instrumentation and Quality Control',4.0,'Theory + Practical'),
    ('CMLT 1102','Human Anatomy and Physiology',4.0,'Theory'),
    ('CMLT 1103','Basic Laboratory Chemistry and Solutions',4.0,'Theory + Practical'),
    ('CMLT 1104','First Aid, Communication and Computer Applications',4.0,'Theory + Practical'),
    ('CMLT 1105','Primary Health Care and Ethics',2.0,'Theory'),
    ('CMLT 1201','Medical Microbiology I (Bacteriology)',4.0,'Theory + Practical'),
    ('CMLT 1202','Medical Parasitology and Entomology I',4.0,'Theory + Practical'),
    ('CMLT 1203','Haematology I',4.0,'Theory + Practical'),
    ('CMLT 1204','Clinical Chemistry I',4.0,'Theory + Practical'),
    ('CMLT 1205','Hospital Laboratory Practicum I',4.0,'Clinical'),
    ('CMLT 2101','Medical Microbiology II (Mycology and Virology)',4.0,'Theory + Practical'),
    ('CMLT 2102','Medical Parasitology II',4.0,'Theory + Practical'),
    ('CMLT 2103','Haematology II and Blood Transfusion Science I',4.0,'Theory + Practical'),
    ('CMLT 2104','Clinical Chemistry II',4.0,'Theory + Practical'),
    ('CMLT 2105','Immunology and Serology',3.0,'Theory + Practical'),
    ('CMLT 2201','Blood Transfusion Science II and Histopathology Basics',4.0,'Theory + Practical'),
    ('CMLT 2202','Laboratory Management, Supply Chain and Biosafety',3.0,'Theory'),
    ('CMLT 2203','Entrepreneurship and Health Records',3.0,'Theory'),
    ('CMLT 2204','Comprehensive Clinical Laboratory Practicum II',8.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Medical Laboratory Technology (MLT)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Medical Laboratory Technology (MLT), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DMLT 1101','Human Anatomy and Physiology',4.0,'Theory'),
    ('DMLT 1102','Analytical and Organic Chemistry',4.0,'Theory + Practical'),
    ('DMLT 1103','Laboratory Instrumentation, Biosafety and First Aid',4.0,'Theory + Practical'),
    ('DMLT 1104','Communication Skills, Psychology and Computer Apps',4.0,'Theory + Practical'),
    ('DMLT 1201','General Microbiology and Systematic Bacteriology I',4.0,'Theory + Practical'),
    ('DMLT 1202','Medical Parasitology and Vector Biology I',4.0,'Theory + Practical'),
    ('DMLT 1203','Biochemistry and Basic Clinical Chemistry',4.0,'Theory + Practical'),
    ('DMLT 1204','Basic Haematology and Primary Health Care',4.0,'Theory + Practical'),
    ('DMLT 2101','Systematic Bacteriology II and Mycology',4.0,'Theory + Practical'),
    ('DMLT 2102','Clinical Chemistry I (Enzymology and Organ Function)',4.0,'Theory + Practical'),
    ('DMLT 2103','Haematology I (Anaemias and Haemostasis)',4.0,'Theory + Practical'),
    ('DMLT 2104','Immunology and Serology',4.0,'Theory + Practical'),
    ('DMLT 2105','Clinical Laboratory Rotation I',4.0,'Clinical'),
    ('DMLT 2201','Virology and Molecular Diagnostics (PCR)',4.0,'Theory + Practical'),
    ('DMLT 2202','Clinical Chemistry II (Endocrinology and Toxicology)',4.0,'Theory + Practical'),
    ('DMLT 2203','Haematology II and Blood Transfusion Science I',4.0,'Theory + Practical'),
    ('DMLT 2204','Histopathology and Cytology I',4.0,'Theory + Practical'),
    ('DMLT 2205','Clinical Laboratory Rotation II',4.0,'Clinical'),
    ('DMLT 3101','Blood Transfusion Science II and Haemovigilance',4.0,'Theory + Practical'),
    ('DMLT 3102','Histopathology and Cytology II',3.0,'Theory + Practical'),
    ('DMLT 3103','Laboratory Quality Management Systems (LQMS / ISO 15189)',4.0,'Theory'),
    ('DMLT 3104','Epidemiology, Biostatistics and Research Methods',4.0,'Theory'),
    ('DMLT 3201','Health Laboratory Management, Ethics and Entrepreneurship',4.0,'Theory'),
    ('DMLT 3202','Laboratory Research Dissertation',4.0,'Project'),
    ('DMLT 3203','Senior Clinical Laboratory Practicum III',8.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Medical Records & Health Informatics (CMR)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Medical Records and Health Informatics (CMR), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CMRI 1101','Introduction to Health Records and Information Management',4.0,'Theory + Practical'),
    ('CMRI 1102','Human Anatomy, Physiology and Medical Terminology I',4.0,'Theory'),
    ('CMRI 1103','Computer Applications and Office Productivity',4.0,'Practical'),
    ('CMRI 1104','Communication Skills, First Aid and Primary Health Care',4.0,'Theory'),
    ('CMRI 1201','Medical Terminology II and Disease Classification (ICD-10/11)',4.0,'Theory + Practical'),
    ('CMRI 1202','Filing, Indexing, Storage and Retrieval Systems',4.0,'Theory + Practical'),
    ('CMRI 1203','Basic Health Statistics and HMIS Reporting (DHIS2)',4.0,'Theory + Practical'),
    ('CMRI 1204','Hospital Records Field Attachment I',4.0,'Field'),
    ('CMRI 2101','Clinical Coding and Morbidity/Mortality Tabulation',4.0,'Theory + Practical'),
    ('CMRI 2102','Electronic Health Records (EHR) and Database Basics',4.0,'Theory + Practical'),
    ('CMRI 2103','Health Information Law, Ethics and Confidentiality',3.0,'Theory'),
    ('CMRI 2104','Epidemiology and Disease Surveillance',3.0,'Theory'),
    ('CMRI 2201','Health Records Department Management and Quality Audit',4.0,'Theory'),
    ('CMRI 2202','Entrepreneurship and Customer Care in Health',3.0,'Theory'),
    ('CMRI 2203','Comprehensive Hospital Records Attachment II',7.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Medical Records & Health Informatics (MER)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Medical Records and Health Informatics (MER), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DMRI 1101','Health Information Systems Architecture and Governance',4.0,'Theory'),
    ('DMRI 1102','Human Anatomy, Physiology and Clinical Terminology',4.0,'Theory'),
    ('DMRI 1103','Operating Systems, Networking and Office Informatics',4.0,'Theory + Practical'),
    ('DMRI 1104','Biostatistics and Quantitative Methods I',4.0,'Theory'),
    ('DMRI 1201','International Classification of Diseases (ICD-11 and ICHI)',4.0,'Theory + Practical'),
    ('DMRI 1202','Relational Database Management Systems (SQL and DHIS2)',4.0,'Theory + Practical'),
    ('DMRI 1203','Epidemiology and Public Health Surveillance',4.0,'Theory'),
    ('DMRI 1204','Health Informatics Practicum I',4.0,'Field'),
    ('DMRI 2101','Electronic Medical Records (EMR) and Interoperability (HL7/FHIR)',4.0,'Theory + Practical'),
    ('DMRI 2102','Health Data Analytics, Visualization and Biostatistics II',4.0,'Theory + Practical'),
    ('DMRI 2103','Data Privacy, Cybersecurity and Health Information Law',3.0,'Theory'),
    ('DMRI 2104','Health Research Methodology',3.0,'Theory'),
    ('DMRI 2201','Health Services Management, M&E and Entrepreneurship',4.0,'Theory'),
    ('DMRI 2202','Health Informatics Research Dissertation',4.0,'Project'),
    ('DMRI 2203','Senior Health Informatics Practicum II',6.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Emergency Care (CEC)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Emergency Care (CEC), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CEC 1101','Anatomy, Physiology and Pre-Hospital Emergency Care Systems',5.0,'Theory + Practical'),
    ('CEC 1102','Basic Life Support (BLS), Airway and Ambulance Operations',5.0,'Theory + Practical'),
    ('CEC 1201','Medical and Paediatric Emergencies and Emergency Pharmacology',5.0,'Theory'),
    ('CEC 1202','Emergency Department and Ambulance Practicum I',5.0,'Clinical'),
    ('CEC 2101','Trauma Management, Burns, Orthopaedics and Triage',5.0,'Theory + Practical'),
    ('CEC 2102','Obstetric and Neonatal Emergencies and Clinical Practicum II',5.0,'Clinical'),
    ('CEC 2201','Mass Casualty Incident (MCI) and Disaster Response Management',4.0,'Theory'),
    ('CEC 2202','Integrated Emergency and Trauma Practicum III',7.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Environmental Health Sciences (CEH)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Environmental Health Sciences (CEH), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CEH 1101','Introduction to Environmental Health, Anatomy and Microbiology',5.0,'Theory'),
    ('CEH 1102','Building Construction, Housing Hygiene and Communication Skills',4.0,'Theory + Practical'),
    ('CEH 1201','Water Supply, Sanitation and Waste Management (WASH)',5.0,'Theory + Field'),
    ('CEH 1202','Vector Biology, Pest Control and Field Attachment I',5.0,'Field'),
    ('CEH 2101','Food Hygiene, Meat Inspection and Port Health',5.0,'Theory + Practical'),
    ('CEH 2102','Communicable Disease Control, Epidemiology and Health Promotion',4.0,'Theory'),
    ('CEH 2201','Occupational Health, Public Health Law and Entrepreneurship',4.0,'Theory'),
    ('CEH 2202','District Environmental Health Practicum II',7.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Medical Theatre Techniques (CTA)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Medical Theatre Techniques (CTA), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CTA 1101','Human Anatomy, Physiology and Microbiology for Theatre',5.0,'Theory'),
    ('CTA 1102','Theatre Design, Asepsis, Sterilization and CSSD Operations',5.0,'Theory + Practical'),
    ('CTA 1201','Surgical Instrumentation, Sutures and Patient Positioning',5.0,'Theory + Practical'),
    ('CTA 1202','Operating Theatre Practicum I',5.0,'Clinical'),
    ('CTA 2101','General, Obstetric and Orthopaedic Surgical Assisting',5.0,'Theory + Practical'),
    ('CTA 2102','Anaesthetic Equipment Support, Recovery Care and Practicum II',5.0,'Clinical'),
    ('CTA 2201','Theatre Management, Inventory, Ethics and Entrepreneurship',4.0,'Theory'),
    ('CTA 2202','Senior Operating Theatre Practicum III',7.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Certificate in Mental Health Nursing (CMHN)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Certificate in Mental Health Nursing (CMHN), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CMHN 1101','Human Anatomy, Physiology and Foundations of Nursing',5.0,'Theory + Practical'),
    ('CMHN 1102','Psychology, Sociology, First Aid and Computer Applications',4.0,'Theory'),
    ('CMHN 1201','General Medical-Surgical Nursing and Pharmacology',5.0,'Theory'),
    ('CMHN 1202','Introduction to Mental Health and Clinical Practicum I',5.0,'Clinical'),
    ('CMHN 2101','Psychiatric Nursing I (Mood, Psychotic and Anxiety Disorders)',5.0,'Theory'),
    ('CMHN 2102','Substance Use Disorders, Neurology and Clinical Practicum II',5.0,'Clinical'),
    ('CMHN 2201','Child and Adolescent Psychiatry, Forensic and Community Mental Health',4.0,'Theory'),
    ('CMHN 2202','Psychiatric Ward Management, Ethics and Final Practicum III',7.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- UHPAB courses - Diploma in Mental Health Nursing (DMHN/DMHND)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'UHPAB',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - UHPAB Diploma in Mental Health Nursing (DMHN/DMHND), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DMHN 1101','Anatomy, Physiology, Foundations of Nursing and Psychology',6.0,'Theory + Practical'),
    ('DMHN 1201','Medical-Surgical Nursing, Pharmacology and General Placement I',6.0,'Clinical'),
    ('DMHN 2101','Adult Psychiatric Nursing I and Psychopharmacology',6.0,'Theory'),
    ('DMHN 2201','Adult Psychiatric Nursing II, Psychotherapy and Placement II',6.0,'Clinical'),
    ('DMHN 3101','Child/Adolescent, Geriatric, Forensic Psychiatry and Research Methods',6.0,'Theory'),
    ('DMHN 3201','Mental Health Leadership, Dissertation and Senior Practicum III',8.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Certificate in Public Health (SB-CPH)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Certificate in Public Health (SB-CPH), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CPH 1101','Foundations of Public Health and Primary Health Care',4.0,'Theory'),
    ('CPH 1102','Human Anatomy, Physiology and Microbiology',4.0,'Theory'),
    ('CPH 1103','Water, Sanitation and Hygiene (WASH)',4.0,'Theory + Field'),
    ('CPH 1104','Communication Skills, First Aid and Computer Applications',4.0,'Theory + Practical'),
    ('CPH 1201','Communicable and Non-Communicable Disease Control',4.0,'Theory'),
    ('CPH 1202','Health Promotion, Education and Behaviour Change',4.0,'Theory + Practical'),
    ('CPH 1203','Community Nutrition and Food Hygiene',3.0,'Theory'),
    ('CPH 1204','Community Health Field Attachment I',4.0,'Field'),
    ('CPH 2101','Basic Epidemiology and Health Statistics',4.0,'Theory'),
    ('CPH 2102','Maternal, Child and Adolescent Health (RMNCAH)',4.0,'Theory'),
    ('CPH 2103','Occupational Health and Environmental Safety',3.0,'Theory'),
    ('CPH 2104','Public Health Laws and Ethics',3.0,'Theory'),
    ('CPH 2201','Community Project Planning, M&E and Entrepreneurship',4.0,'Theory'),
    ('CPH 2202','Disaster Preparedness and Emergency Response',3.0,'Theory'),
    ('CPH 2203','Comprehensive District Public Health Practicum II',7.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Diploma in Public Health (SB-DPH)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Diploma in Public Health (SB-DPH), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DPH 1101','Principles of Public Health and Health Systems',4.0,'Theory'),
    ('DPH 1102','Applied Human Biology, Microbiology and Parasitology',4.0,'Theory'),
    ('DPH 1103','Environmental Health, WASH and Vector Control',4.0,'Theory + Field'),
    ('DPH 1104','Health Informatics, Communication and Psychology',4.0,'Theory + Practical'),
    ('DPH 1201','Epidemiology I and Disease Surveillance',4.0,'Theory'),
    ('DPH 1202','Biostatistics and Demographic Methods',4.0,'Theory + Practical'),
    ('DPH 1203','Health Promotion, Social Marketing and SBCC',4.0,'Theory'),
    ('DPH 1204','Public Health Field Placement I',4.0,'Field'),
    ('DPH 2101','Epidemiology II and Outbreak Investigation',4.0,'Theory + Practical'),
    ('DPH 2102','Public Health Nutrition and Food Security',4.0,'Theory'),
    ('DPH 2103','Reproductive, Maternal, Newborn and Child Health',4.0,'Theory'),
    ('DPH 2104','Public Health Research Methodology',4.0,'Theory'),
    ('DPH 2201','Health Policy, Planning, Financing and M&E',4.0,'Theory'),
    ('DPH 2202','Global Health, Occupational Safety and Entrepreneurship',3.0,'Theory'),
    ('DPH 2203','Public Health Research Dissertation',4.0,'Project'),
    ('DPH 2204','Senior Public Health Practicum II',6.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Certificate in Food Science & Nutrition (KSHS-CFSN)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Certificate in Food Science and Nutrition (KSHS-CFSN), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CFSN 1101','Introduction to Food Science and Human Nutrition',4.0,'Theory'),
    ('CFSN 1102','Basic Food Chemistry and Human Biology',4.0,'Theory + Practical'),
    ('CFSN 1103','Food Hygiene, Sanitation and Safety',4.0,'Theory + Practical'),
    ('CFSN 1104','Communication Skills, First Aid and Computer Apps',4.0,'Theory + Practical'),
    ('CFSN 1201','Food Microbiology and Spoilage Control',4.0,'Theory + Practical'),
    ('CFSN 1202','Nutrition Across the Lifecycle',4.0,'Theory'),
    ('CFSN 1203','Food Preservation and Processing Techniques I',4.0,'Theory + Practical'),
    ('CFSN 1204','Industrial and Community Nutrition Attachment I',4.0,'Field'),
    ('CFSN 2101','Community Nutrition and Malnutrition Management (IMAM)',4.0,'Theory + Practical'),
    ('CFSN 2102','Food Processing and Packaging Technology II',4.0,'Theory + Practical'),
    ('CFSN 2103','Nutrition Assessment and Surveillance',4.0,'Theory + Practical'),
    ('CFSN 2104','Food Quality Control and Standards (UNBS)',3.0,'Theory'),
    ('CFSN 2201','Meal Planning and Institutional Catering',4.0,'Theory + Practical'),
    ('CFSN 2202','Agribusiness, Food Security and Entrepreneurship',4.0,'Theory'),
    ('CFSN 2203','Comprehensive Food and Nutrition Practicum II',6.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Diploma in Human Nutrition & Dietetics (SB-DHND)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Diploma in Human Nutrition and Dietetics (SB-DHND), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DHND 1101','Human Anatomy, Physiology and Nutritional Biochemistry',4.0,'Theory'),
    ('DHND 1102','Principles of Human Nutrition and Macronutrients',4.0,'Theory'),
    ('DHND 1103','Food Chemistry, Food Microbiology and HACCP Safety',4.0,'Theory + Practical'),
    ('DHND 1104','Communication, Psychology and Health Informatics',4.0,'Theory + Practical'),
    ('DHND 1201','Micronutrients, Metabolism and Nutritional Assessment',4.0,'Theory + Practical'),
    ('DHND 1202','Maternal, Infant and Young Child Nutrition (MIYCN)',4.0,'Theory'),
    ('DHND 1203','Food Processing, Preservation and Product Development',4.0,'Theory + Practical'),
    ('DHND 1204','Clinical and Community Nutrition Placement I',4.0,'Clinical / Field'),
    ('DHND 2101','Clinical Dietetics and Medical Nutrition Therapy I',4.0,'Theory + Practical'),
    ('DHND 2102','Integrated Management of Acute Malnutrition (IMAM)',4.0,'Theory + Clinical'),
    ('DHND 2103','Nutrition Epidemiology, Biostatistics and Research Methods',4.0,'Theory'),
    ('DHND 2104','Food Quality Assurance, Toxicology and Food Laws',3.0,'Theory'),
    ('DHND 2201','Clinical Dietetics and Medical Nutrition Therapy II',4.0,'Theory + Clinical'),
    ('DHND 2202','Nutrition Programme Planning, M&E and Entrepreneurship',4.0,'Theory'),
    ('DHND 2203','Nutrition and Dietetics Research Dissertation',4.0,'Project'),
    ('DHND 2204','Senior Hospital Dietetics and Food Industry Practicum II',6.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Diploma in Food Science & Technology (KSHS-DFSN)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Diploma in Food Science and Technology (KSHS-DFSN), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DFST 1101','Food Chemistry, Composition and Biochemistry',4.0,'Theory + Lab'),
    ('DFST 1102','General and Food Microbiology',4.0,'Theory + Lab'),
    ('DFST 1103','Food Engineering Principles, Mathematics and ICT',4.0,'Theory + Practical'),
    ('DFST 1201','Food Processing and Preservation Technology I (Thermal and Cold)',4.0,'Theory + Practical'),
    ('DFST 1202','Food Analysis, Instrumentation and Sensory Evaluation',4.0,'Theory + Lab'),
    ('DFST 1203','Food Plant Attachment I',4.0,'Field'),
    ('DFST 2101','Dairy, Meat, Cereal and Beverage Processing Technology',4.0,'Theory + Practical'),
    ('DFST 2102','Food Safety Management (HACCP, ISO 22000 and UNBS Standards)',4.0,'Theory'),
    ('DFST 2103','Post-Harvest Handling, Packaging and Research Methods',4.0,'Theory'),
    ('DFST 2201','New Food Product Development, Entrepreneurship and Dissertation',5.0,'Project'),
    ('DFST 2202','Senior Food Industry Practicum II',6.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Diploma in Diagnostic Sonography (KSHS-DDS)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Diploma in Diagnostic Sonography (KSHS-DDS), 6 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DDS 1101','Cross-Sectional Human Anatomy and Physiology I',4.0,'Theory + Lab'),
    ('DDS 1102','Acoustics and Ultrasound Physics I',4.0,'Theory'),
    ('DDS 1103','Patient Care, Ethics and Infection Control in Imaging',3.0,'Theory + Practical'),
    ('DDS 1104','Communication Skills, First Aid and Medical Informatics',4.0,'Theory + Practical'),
    ('DDS 1201','Cross-Sectional Anatomy and Pathology II',4.0,'Theory'),
    ('DDS 1202','Ultrasound Instrumentation, Artifacts and Knobology',4.0,'Theory + Practical'),
    ('DDS 1203','Abdominal Sonography I (Liver, Biliary, Pancreas, Spleen)',4.0,'Theory + Practical'),
    ('DDS 1204','Clinical Sonography Scanning Practicum I',4.0,'Clinical'),
    ('DDS 2101','Abdominal Sonography II (Renal, Retroperitoneum and GI)',4.0,'Theory + Practical'),
    ('DDS 2102','Obstetric Sonography I (First Trimester and Biometry)',4.0,'Theory + Practical'),
    ('DDS 2103','Gynaecological Sonography (Pelvic and Transvaginal)',4.0,'Theory + Practical'),
    ('DDS 2104','Clinical Sonography Scanning Practicum II',5.0,'Clinical'),
    ('DDS 2201','Obstetric Sonography II (Foetal Anomalies and High-Risk)',4.0,'Theory + Practical'),
    ('DDS 2202','Small Parts and Superficial Structures (Thyroid, Breast, Scrotum)',4.0,'Theory + Practical'),
    ('DDS 2203','Doppler Physics and Basic Vascular Ultrasound',4.0,'Theory + Practical'),
    ('DDS 2204','Clinical Sonography Scanning Practicum III',5.0,'Clinical'),
    ('DDS 3101','Vascular Sonography (Carotid, Peripheral Arterial and Venous)',4.0,'Theory + Practical'),
    ('DDS 3102','Paediatric, Cranial and Musculoskeletal Sonography',4.0,'Theory + Practical'),
    ('DDS 3103','Biostatistics and Imaging Research Methodology',3.0,'Theory'),
    ('DDS 3104','Clinical Sonography Scanning Practicum IV',5.0,'Clinical'),
    ('DDS 3201','Echocardiography Basics and Interventional Ultrasound',3.0,'Theory + Practical'),
    ('DDS 3202','Imaging Department Management, QA and Entrepreneurship',3.0,'Theory'),
    ('DDS 3203','Diagnostic Sonography Research Dissertation',4.0,'Project'),
    ('DDS 3204','Senior Clinical Sonography Practicum V',6.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Advanced Diploma in Diagnostic Sonography (SB-ADDS)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Advanced Diploma in Diagnostic Sonography (SB-ADDS), 2 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('ADDS 4101','Advanced Ultrasound Physics, Doppler and Instrumentation',4.0,'Theory + Practical'),
    ('ADDS 4102','Abdominal, Pelvic and High-Risk Obstetric Sonography',5.0,'Theory + Practical'),
    ('ADDS 4103','Clinical Sonography Attachment I',5.0,'Clinical'),
    ('ADDS 4201','Vascular, Small Parts, MSK and Point-of-Care Ultrasound (POCUS)',5.0,'Theory + Practical'),
    ('ADDS 4202','Sonography Quality Assurance, Reporting and Case Portfolio',4.0,'Project'),
    ('ADDS 4203','Senior Clinical Sonography Attachment II',6.0,'Clinical Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Certificate in Biomedical Engineering (KSHS-CBME)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Certificate in Biomedical Engineering (KSHS-CBME), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('CBME 1101','Engineering Mathematics and Applied Physics',4.0,'Theory'),
    ('CBME 1102','Basic Electrical and Electronic Circuits',4.0,'Theory + Lab'),
    ('CBME 1103','Human Anatomy and Physiology for Engineers',3.0,'Theory'),
    ('CBME 1104','Workshop Technology, Safety and Computer Applications',4.0,'Practical'),
    ('CBME 1201','Analogue and Digital Electronics',4.0,'Theory + Lab'),
    ('CBME 1202','Biomedical Sensors, Transducers and Instrumentation',4.0,'Theory + Lab'),
    ('CBME 1203','Hospital Mechanical and Pneumatic Systems',3.0,'Theory + Practical'),
    ('CBME 1204','Hospital Biomedical Workshop Attachment I',4.0,'Field'),
    ('CBME 2101','Diagnostic and Patient Monitoring Equipment',4.0,'Theory + Practical'),
    ('CBME 2102','Laboratory and Sterilization Equipment Maintenance',4.0,'Theory + Practical'),
    ('CBME 2103','Medical Electrical Safety and Calibration',4.0,'Theory + Practical'),
    ('CBME 2104','Communication Skills and Medical Equipment Standards',3.0,'Theory'),
    ('CBME 2201','Therapeutic, Theatre and Neonatal Equipment',4.0,'Theory + Practical'),
    ('CBME 2202','Healthcare Technology Management and Entrepreneurship',3.0,'Theory'),
    ('CBME 2203','Comprehensive Hospital Engineering Attachment II',7.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Diploma in Biomedical Engineering (KSHS-DBME)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Diploma in Biomedical Engineering (KSHS-DBME), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DBME 1101','Engineering Mathematics I and Circuit Theory',4.0,'Theory + Lab'),
    ('DBME 1102','Human Anatomy, Physiology and Biophysics',4.0,'Theory'),
    ('DBME 1103','Engineering Drawing, CAD and Workshop Practice',4.0,'Practical'),
    ('DBME 1104','Programming and Computer Applications in Engineering',3.0,'Practical'),
    ('DBME 1201','Analogue, Digital and Microprocessor Systems',4.0,'Theory + Lab'),
    ('DBME 1202','Biomedical Instrumentation and Biosensors',4.0,'Theory + Lab'),
    ('DBME 1203','Biomaterials, Biomechanics and Prosthetics',4.0,'Theory'),
    ('DBME 1204','Industrial and Hospital Engineering Attachment I',4.0,'Field'),
    ('DBME 2101','Medical Imaging Systems (X-Ray, Ultrasound, CT/MRI)',4.0,'Theory + Lab'),
    ('DBME 2102','Critical Care, Dialysis and Life Support Equipment',4.0,'Theory + Practical'),
    ('DBME 2103','Biomedical Signal Processing and Telemedicine',4.0,'Theory'),
    ('DBME 2104','Engineering Research Methodology and Quality Standards',3.0,'Theory'),
    ('DBME 2201','Hospital Plant, Medical Gas and Power Backup Systems',4.0,'Theory + Practical'),
    ('DBME 2202','Healthcare Technology Procurement and Entrepreneurship',3.0,'Theory'),
    ('DBME 2203','Biomedical Engineering Design Project',4.0,'Project'),
    ('DBME 2204','Senior Clinical Engineering Practicum II',6.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Guidance & Counselling (SB-CGC / SB-DHCG)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Guidance and Counselling (SB-CGC / SB-DHCG), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DHCG 1101','Foundations of Psychology and Human Growth Development',4.0,'Theory'),
    ('DHCG 1102','Theories and Techniques of Guidance and Counselling',4.0,'Theory + Practical'),
    ('DHCG 1103','Communication Skills, Ethics and Computer Applications',4.0,'Theory + Practical'),
    ('DHCG 1201','HIV/AIDS, Reproductive Health and Chronic Illness Counselling',4.0,'Theory + Practical'),
    ('DHCG 1202','Mental Health, Trauma and Substance Abuse Counselling',4.0,'Theory'),
    ('DHCG 1203','Clinical and Community Counselling Practicum I',4.0,'Field'),
    ('DHCG 2101','Child, Adolescent, Marriage and Family Therapy',4.0,'Theory'),
    ('DHCG 2102','Psychosocial Support, Grief and Palliative Counselling',4.0,'Theory'),
    ('DHCG 2103','Research Methods and Psychological Assessment',4.0,'Theory'),
    ('DHCG 2201','Counselling Centre Management and Entrepreneurship',4.0,'Theory'),
    ('DHCG 2202','Research Project and Senior Counselling Practicum II',8.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Records Management (SB-CRM-C / SB-DRM)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Records Management (SB-CRM-C / SB-DRM), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DRM 1101','Principles of Records, Archives and Information Management',4.0,'Theory'),
    ('DRM 1102','Office Administration, Communication and IT Applications',4.0,'Theory + Practical'),
    ('DRM 1201','Classification, Indexing, Registry and Retention Schedules',4.0,'Theory + Practical'),
    ('DRM 1202','Database Systems and Records Practicum I',6.0,'Field'),
    ('DRM 2101','Electronic Document and Records Management Systems (EDRMS)',4.0,'Theory + Practical'),
    ('DRM 2102','Information Law, Access to Information and Data Security',4.0,'Theory'),
    ('DRM 2201','Archives Conservation, Entrepreneurship and Senior Practicum II',8.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Secretarial Studies & Office Management (KSHS-CSSOM / KSHS-DSSOM)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Secretarial Studies and Office Management (KSHS-CSSOM / KSHS-DSSOM), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('DSSOM 1101','Keyboarding, Word Processing and Document Production I',4.0,'Practical'),
    ('DSSOM 1102','Business Communication and Office Practice I',4.0,'Theory'),
    ('DSSOM 1201','Spreadsheets, Databases and Presentation Software',4.0,'Practical'),
    ('DSSOM 1202','Secretarial Duties, Records and Industrial Attachment I',6.0,'Field'),
    ('DSSOM 2101','Executive Office Management, Public Relations and Law',4.0,'Theory'),
    ('DSSOM 2102','Basic Accounting, Procurement and Human Resource Mgt',4.0,'Theory'),
    ('DSSOM 2201','Desktop Publishing, Entrepreneurship and Senior Attachment II',8.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Health Promotion & Education (SB-ADHPE)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Advanced Diploma in Health Promotion and Education (SB-ADHPE), 4 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('ADHPE 1101','Foundations of Health Promotion, Behavioural Theories and Ethics',4.0,'Theory'),
    ('ADHPE 1201','Social and Behaviour Change Communication (SBCC) and Media',4.0,'Theory + Practical'),
    ('ADHPE 2101','Community Mobilization, Advocacy and Health Policy',4.0,'Theory + Field'),
    ('ADHPE 2201','Health Programme Evaluation, Dissertation and Practicum',8.0,'Field Final')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));

-- SCHOOL_BASED courses - Bridging Programme (SB-BRIDGE)
INSERT INTO ""Courses"" (""Id"",""AuthorityCode"",""Code"",""Name"",""CreditUnits"",""Description"",""CourseType"",""IsActive"")
SELECT gen_random_uuid(),'SCHOOL_BASED',s.""Code"",s.""Name"",s.""CreditUnits"",
       'KSHS Master Curriculum Catalog - SCHOOL_BASED Bridging Programme (SB-BRIDGE), 2 Semesters',s.""CourseType"",TRUE
FROM (VALUES
    ('BRDG 1101','Foundational Biology and Human Anatomy',4.0,'Theory + Lab'),
    ('BRDG 1102','Foundational Chemistry and Physics for Health Sciences',4.0,'Theory + Lab'),
    ('BRDG 1201','Applied Mathematics, Biostatistics and Computer Literacy',4.0,'Theory + Practical'),
    ('BRDG 1202','English Communication, Study Skills and Medical Ethics',4.0,'Theory')
) AS s(""Code"",""Name"",""CreditUnits"",""CourseType"")
WHERE NOT EXISTS (SELECT 1 FROM ""Courses"" c WHERE upper(c.""Code"")=upper(s.""Code""));
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Retain catalogue records on rollback.
    }
}
