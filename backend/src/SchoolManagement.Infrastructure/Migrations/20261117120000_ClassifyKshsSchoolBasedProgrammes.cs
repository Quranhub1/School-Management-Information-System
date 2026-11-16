using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SchoolManagement.Infrastructure.Persistence;

#nullable disable

namespace SchoolManagement.Infrastructure.Migrations;

[DbContext(typeof(SchoolManagementDbContext))]
[Migration("20261117120000_ClassifyKshsSchoolBasedProgrammes")]
public partial class ClassifyKshsSchoolBasedProgrammes : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(@"
-- The KSHS programme page is explicitly labelled 2024/2025. These existing
-- institutional offerings are retained as School-based and now cite that source.
UPDATE ""Programmes""
SET ""Regulator"" = 'SCHOOL_BASED',
    ""ApprovalStatus"" = 'Institutional',
    ""SourceReference"" = 'Kampala School of Health Sciences programmes (2024/2025): https://www.kshs.ac.ug/programs/',
    ""IsReferenceOnly"" = FALSE,
    ""IsActive"" = TRUE
WHERE ""Code"" IN ('SB-CPH','SB-CRM-C','SB-CGC','SB-DPH','SB-DRM','SB-DHCG','SB-BRIDGE');

-- Human Nutrition and Dietetics is listed by KSHS under Other Short & In-Service
-- Courses, but is not present in the UHPAB December 2025 examined-programme list
-- or the normalized UVTAB assessor register. Preserve its programme identity
-- while correcting its authority classification and catalogue code.
UPDATE ""Programmes""
SET ""Code"" = 'SB-DHND',
    ""Regulator"" = 'SCHOOL_BASED',
    ""ApprovalStatus"" = 'Institutional',
    ""DurationYears"" = 2,
    ""DurationUnit"" = 'Years',
    ""Type"" = 1,
    ""SourceReference"" = 'Kampala School of Health Sciences programmes (2024/2025), Other Short & In-Service Courses: https://www.kshs.ac.ug/programs/',
    ""IsReferenceOnly"" = FALSE,
    ""IsActive"" = TRUE
WHERE ""Code"" = 'UHPAB-DHND';

-- KSHS lists this as a one-year short/in-service offering. It is not the
-- same award as the generic UVTAB Sonography certificate/diploma references.
INSERT INTO ""Programmes""
(""Id"",""DepartmentId"",""Code"",""Name"",""Award"",""AwardTitle"",""DurationYears"",""DurationUnit"",""StudyMode"",""DeliveryType"",""Type"",""Regulator"",""ApprovalReference"",""ApprovalDate"",""ApprovalStatus"",""SourceReference"",""IsReferenceOnly"",""IsActive"")
VALUES
(gen_random_uuid(),NULL,'SB-ADDS','Advanced Diploma in Diagnostic Sonography','Advanced Diploma',NULL,1,'Years','Full-time','Academic',1,'SCHOOL_BASED',NULL,NULL,'Institutional','Kampala School of Health Sciences programmes (2024/2025), Other Short & In-Service Courses: https://www.kshs.ac.ug/programs/',FALSE,TRUE)
ON CONFLICT (""Code"") DO NOTHING;
");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Preserve programme records and references on rollback. This data-only
        // classification is intentionally non-destructive.
    }
}
